import { SupabaseClient } from '@supabase/supabase-js';
import { Contact } from 'xero-node';
import { createLogger } from '@/lib/utils/logger';
import { getActiveConnection, getAuthenticatedClient } from './client';
import {
  mapCustomerToXeroContact,
  mapTransactionToXeroInvoice,
  mapCartItemToXeroLineItem,
  mapPaymentForInvoice,
} from './mappers';

const logger = createLogger('XERO_SYNC');

export async function syncToXero(transactionId: string, supabase: SupabaseClient): Promise<void> {
  try {
    // Check if Xero is connected
    const connection = await getActiveConnection(supabase);
    if (!connection) {
      logger.log('Xero not connected, skipping sync for transaction:', transactionId);
      return;
    }

    // Fetch transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      logger.error('Transaction not found for sync:', transactionId);
      return;
    }

    // Check idempotency - skip if already synced
    const { data: existingSync } = await supabase
      .from('xero_sync_log')
      .select('id')
      .eq('transaction_id', transactionId)
      .eq('sync_type', 'invoice')
      .eq('sync_status', 'success')
      .single();

    if (existingSync) {
      logger.log('Transaction already synced to Xero, skipping:', transactionId);
      return;
    }

    // Create pending sync log entry
    const { data: syncLog, error: syncLogError } = await supabase
      .from('xero_sync_log')
      .insert({
        transaction_id: transactionId,
        sync_type: 'invoice',
        sync_status: 'pending',
      })
      .select()
      .single();

    if (syncLogError) {
      logger.error('Failed to create sync log:', syncLogError);
      return;
    }

    // Fetch customer
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', transaction.customer_id)
      .single();

    if (!customer) {
      await updateSyncLog(supabase, syncLog.id, 'failed', 'Customer not found');
      return;
    }

    // Check for business customer (for ABN)
    const { data: businessCustomer } = await supabase
      .from('business_customers')
      .select('abn')
      .eq('id', customer.business_customer_id)
      .single();

    // Get authenticated Xero client
    const auth = await getAuthenticatedClient(supabase);
    if (!auth) {
      await updateSyncLog(supabase, syncLog.id, 'failed', 'Failed to authenticate with Xero');
      return;
    }

    const { xero, tenantId } = auth;

    // Upsert contact
    const contactId = await upsertXeroContact(customer, businessCustomer, xero, tenantId, supabase);
    if (!contactId) {
      await updateSyncLog(supabase, syncLog.id, 'failed', 'Failed to upsert Xero contact');
      return;
    }

    // Map cart items to line items, looking up xero item codes
    const cartItems = transaction.product_details?.items || [];
    const lineItems = await Promise.all(
      cartItems.map(async (item: any) => {
        let xeroItemCode: string | undefined;
        if (item.product?.id || item.productId) {
          const productId = item.product?.id || item.productId;
          const { data: xeroItem } = await supabase
            .from('xero_items')
            .select('xero_item_id')
            .eq('product_id', productId)
            .eq('sync_status', 'synced')
            .single();
          if (xeroItem) {
            xeroItemCode = xeroItem.xero_item_id;
          }
        }
        return mapCartItemToXeroLineItem(item, xeroItemCode);
      })
    );

    // Create invoice
    const invoiceData = mapTransactionToXeroInvoice(transaction, contactId, lineItems);
    const invoiceResponse = await xero.accountingApi.createInvoices(
      tenantId,
      { invoices: [invoiceData] }
    );

    const createdInvoice = invoiceResponse.body?.invoices?.[0];
    if (!createdInvoice?.invoiceID) {
      const errMsg = createdInvoice?.validationErrors?.map(e => e.message).join('; ') || 'Unknown invoice creation error';
      await updateSyncLog(supabase, syncLog.id, 'failed', errMsg);
      return;
    }

    // Apply payment
    const paymentData = mapPaymentForInvoice(
      createdInvoice.invoiceID,
      transaction.amount_aud,
      transaction.created_at
    );

    await xero.accountingApi.createPayment(tenantId, paymentData);

    // Update sync log as success
    await supabase
      .from('xero_sync_log')
      .update({
        sync_status: 'success',
        xero_invoice_id: createdInvoice.invoiceID,
        xero_contact_id: contactId,
        completed_at: new Date().toISOString(),
      })
      .eq('id', syncLog.id);

    logger.log('Xero sync completed for transaction:', transactionId, 'Invoice:', createdInvoice.invoiceID);
  } catch (err: any) {
    logger.error('Xero sync failed for transaction:', transactionId, err);
    // Try to update the sync log with the error
    try {
      await supabase
        .from('xero_sync_log')
        .update({
          sync_status: 'failed',
          error_message: err.message || 'Unknown error',
          retry_count: 0,
          completed_at: new Date().toISOString(),
        })
        .eq('transaction_id', transactionId)
        .eq('sync_type', 'invoice')
        .eq('sync_status', 'pending');
    } catch {
      logger.error('Failed to update sync log after error');
    }
  }
}

async function upsertXeroContact(
  customer: any,
  businessCustomer: any,
  xero: any,
  tenantId: string,
  supabase: SupabaseClient
): Promise<string | null> {
  try {
    const contactData = mapCustomerToXeroContact(customer, businessCustomer);

    // Search for existing contact by email
    let existingContactId: string | undefined;
    if (customer.email) {
      const searchResponse = await xero.accountingApi.getContacts(
        tenantId,
        undefined, // ifModifiedSince
        `EmailAddress=="${customer.email}"` // where clause
      );
      const existingContacts = searchResponse.body?.contacts;
      if (existingContacts && existingContacts.length > 0) {
        existingContactId = existingContacts[0].contactID;
      }
    }

    let contactId: string;

    if (existingContactId) {
      // Update existing contact
      const updateData: Contact = { ...contactData, contactID: existingContactId };
      await xero.accountingApi.updateContact(tenantId, existingContactId, { contacts: [updateData] });
      contactId = existingContactId;
      logger.log('Updated existing Xero contact:', contactId);
    } else {
      // Create new contact
      const createResponse = await xero.accountingApi.createContacts(
        tenantId,
        { contacts: [contactData] }
      );
      const created = createResponse.body?.contacts?.[0];
      if (!created?.contactID) {
        logger.error('Failed to create Xero contact');
        return null;
      }
      contactId = created.contactID;
      logger.log('Created new Xero contact:', contactId);
    }

    // Log contact sync
    await supabase.from('xero_sync_log').insert({
      transaction_id: null,
      sync_type: 'contact',
      xero_contact_id: contactId,
      sync_status: 'success',
      completed_at: new Date().toISOString(),
    });

    return contactId;
  } catch (err: any) {
    logger.error('Failed to upsert Xero contact:', err);
    await supabase.from('xero_sync_log').insert({
      sync_type: 'contact',
      sync_status: 'failed',
      error_message: err.message,
      completed_at: new Date().toISOString(),
    });
    return null;
  }
}

async function updateSyncLog(
  supabase: SupabaseClient,
  syncLogId: string,
  status: string,
  errorMessage: string
): Promise<void> {
  logger.error('Sync failed:', errorMessage);
  await supabase
    .from('xero_sync_log')
    .update({
      sync_status: status,
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', syncLogId);
}

export async function retryFailedSync(syncLogId: string, supabase: SupabaseClient): Promise<void> {
  const { data: syncLog, error } = await supabase
    .from('xero_sync_log')
    .select('*')
    .eq('id', syncLogId)
    .single();

  if (error || !syncLog) {
    logger.error('Sync log not found for retry:', syncLogId);
    return;
  }

  if (syncLog.sync_status !== 'failed') {
    logger.log('Sync log is not in failed state, skipping retry:', syncLogId);
    return;
  }

  // Increment retry count
  await supabase
    .from('xero_sync_log')
    .update({ retry_count: (syncLog.retry_count || 0) + 1 })
    .eq('id', syncLogId);

  // Re-run sync for the transaction
  if (syncLog.transaction_id) {
    await syncToXero(syncLog.transaction_id, supabase);
  }
}
