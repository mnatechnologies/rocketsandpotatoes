import { SupabaseClient } from '@supabase/supabase-js';
import { ManualJournal, ManualJournalLine } from 'xero-node';
import { createLogger } from '@/lib/utils/logger';
import { getAuthenticatedClient } from './client';
import { mapProductToXeroItem } from './mappers';
import { Product } from '@/types/product';

const logger = createLogger('XERO_INVENTORY');

const XERO_INVENTORY_ACCOUNT_CODE = process.env.XERO_INVENTORY_ACCOUNT_CODE || '630';
const XERO_WRITEOFF_ACCOUNT_CODE = process.env.XERO_WRITEOFF_ACCOUNT_CODE || '300';

export async function syncProductToXeroItem(productId: string, supabase: SupabaseClient): Promise<void> {
  try {
    const auth = await getAuthenticatedClient(supabase);
    if (!auth) {
      logger.log('Xero not connected, skipping item sync for product:', productId);
      return;
    }

    const { xero, tenantId } = auth;

    // Fetch product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      logger.error('Product not found:', productId);
      return;
    }

    const xeroItemData = mapProductToXeroItem(product as Product);

    // Check for existing xero_items mapping
    const { data: existingMapping } = await supabase
      .from('xero_items')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (existingMapping) {
      // Update existing Xero item
      try {
        await xero.accountingApi.updateOrCreateItems(
          tenantId,
          { items: [{ ...xeroItemData, itemID: existingMapping.xero_item_id }] }
        );

        await supabase
          .from('xero_items')
          .update({
            sync_status: 'synced',
            last_synced_at: new Date().toISOString(),
          })
          .eq('id', existingMapping.id);

        logger.log('Updated Xero item for product:', productId);
      } catch (err: any) {
        logger.error('Failed to update Xero item:', err);
        await supabase
          .from('xero_items')
          .update({ sync_status: 'failed' })
          .eq('id', existingMapping.id);

        await logItemSync(supabase, productId, 'failed', err.message);
        return;
      }
    } else {
      // Create new Xero item
      try {
        const response = await xero.accountingApi.createItems(
          tenantId,
          { items: [xeroItemData] }
        );

        const createdItem = response.body?.items?.[0];
        if (!createdItem?.itemID) {
          const errMsg = createdItem?.validationErrors?.map((e: any) => e.message).join('; ') || 'Unknown error';
          logger.error('Failed to create Xero item:', errMsg);
          await logItemSync(supabase, productId, 'failed', errMsg);
          return;
        }

        await supabase.from('xero_items').insert({
          product_id: productId,
          xero_item_id: createdItem.itemID,
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
        });

        logger.log('Created Xero item for product:', productId, 'ItemID:', createdItem.itemID);
      } catch (err: any) {
        logger.error('Failed to create Xero item:', err);
        await logItemSync(supabase, productId, 'failed', err.message);
        return;
      }
    }

    await logItemSync(supabase, productId, 'success');
  } catch (err: any) {
    logger.error('Item sync failed for product:', productId, err);
    await logItemSync(supabase, productId, 'failed', err.message);
  }
}

export async function syncAllProductsToXero(
  supabase: SupabaseClient
): Promise<{ synced: number; failed: number; errors: string[] }> {
  const { data: products, error } = await supabase
    .from('products')
    .select('id');

  if (error || !products) {
    logger.error('Failed to fetch products for sync:', error);
    return { synced: 0, failed: 0, errors: ['Failed to fetch products'] };
  }

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const product of products) {
    try {
      await syncProductToXeroItem(product.id, supabase);
      synced++;
    } catch (err: any) {
      failed++;
      errors.push(`${product.id}: ${err.message}`);
    }
  }

  logger.log(`Product sync complete: ${synced} synced, ${failed} failed`);
  return { synced, failed, errors };
}

export async function syncStockAdjustmentToXero(adjustmentId: string, supabase: SupabaseClient): Promise<void> {
  try {
    const auth = await getAuthenticatedClient(supabase);
    if (!auth) {
      logger.log('Xero not connected, skipping stock adjustment sync');
      return;
    }

    const { xero, tenantId } = auth;

    // Fetch the stock adjustment
    const { data: adjustment, error: adjError } = await supabase
      .from('stock_adjustments')
      .select('*, products(name, calculated_price, price)')
      .eq('id', adjustmentId)
      .single();

    if (adjError || !adjustment) {
      logger.error('Stock adjustment not found:', adjustmentId);
      return;
    }

    const productPrice = adjustment.products?.calculated_price || adjustment.products?.price || 0;
    const productName = adjustment.products?.name || 'Unknown Product';

    // Create manual journal: debit write-off, credit inventory
    const journalLines: ManualJournalLine[] = [
      {
        lineAmount: productPrice,
        accountCode: XERO_WRITEOFF_ACCOUNT_CODE,
        description: `Stock ${adjustment.adjustment_type}: ${productName} - ${adjustment.reason}`,
        taxType: 'EXEMPTOUTPUT',
      },
      {
        lineAmount: -productPrice,
        accountCode: XERO_INVENTORY_ACCOUNT_CODE,
        description: `Stock ${adjustment.adjustment_type}: ${productName} - ${adjustment.reason}`,
        taxType: 'EXEMPTOUTPUT',
      },
    ];

    const journal: ManualJournal = {
      narration: `Stock adjustment: ${adjustment.adjustment_type} - ${adjustment.reason}`,
      journalLines,
      date: new Date().toISOString().split('T')[0],
      status: ManualJournal.StatusEnum.POSTED,
    };

    const response = await xero.accountingApi.createManualJournals(
      tenantId,
      { manualJournals: [journal] }
    );

    const createdJournal = response.body?.manualJournals?.[0];
    if (!createdJournal?.manualJournalID) {
      const errMsg = createdJournal?.validationErrors?.map((e: any) => e.message).join('; ') || 'Unknown error';
      logger.error('Failed to create manual journal:', errMsg);

      await supabase
        .from('stock_adjustments')
        .update({ sync_status: 'failed' })
        .eq('id', adjustmentId);

      await supabase.from('xero_sync_log').insert({
        sync_type: 'adjustment',
        sync_status: 'failed',
        error_message: errMsg,
        completed_at: new Date().toISOString(),
      });
      return;
    }

    // Update stock adjustment with journal ID
    await supabase
      .from('stock_adjustments')
      .update({
        xero_journal_id: createdJournal.manualJournalID,
        sync_status: 'synced',
      })
      .eq('id', adjustmentId);

    await supabase.from('xero_sync_log').insert({
      sync_type: 'adjustment',
      sync_status: 'success',
      xero_item_id: createdJournal.manualJournalID,
      completed_at: new Date().toISOString(),
    });

    logger.log('Stock adjustment synced to Xero journal:', createdJournal.manualJournalID);
  } catch (err: any) {
    logger.error('Stock adjustment sync failed:', err);

    await supabase
      .from('stock_adjustments')
      .update({ sync_status: 'failed' })
      .eq('id', adjustmentId);

    await supabase.from('xero_sync_log').insert({
      sync_type: 'adjustment',
      sync_status: 'failed',
      error_message: err.message,
      completed_at: new Date().toISOString(),
    });
  }
}

export async function handleXeroItemWebhook(
  payload: any,
  supabase: SupabaseClient
): Promise<void> {
  try {
    const events = payload.events;
    if (!events || !Array.isArray(events)) {
      logger.log('No events in Xero webhook payload');
      return;
    }

    for (const event of events) {
      if (event.eventCategory !== 'ITEM' || event.eventType !== 'UPDATE') {
        continue;
      }

      const xeroItemId = event.resourceId;
      if (!xeroItemId) continue;

      // Find matching xero_items record
      const { data: xeroItemMapping } = await supabase
        .from('xero_items')
        .select('product_id')
        .eq('xero_item_id', xeroItemId)
        .single();

      if (!xeroItemMapping) {
        logger.log('No product mapping found for Xero item:', xeroItemId);
        continue;
      }

      // Fetch updated item from Xero
      const auth = await getAuthenticatedClient(supabase);
      if (!auth) continue;

      const { xero, tenantId } = auth;
      const itemResponse = await xero.accountingApi.getItem(tenantId, xeroItemId);
      const xeroItem = itemResponse.body?.items?.[0];
      if (!xeroItem) continue;

      // Update product fields that changed
      const updates: Record<string, any> = {};
      if (xeroItem.name) updates.name = xeroItem.name;
      if (xeroItem.description) updates.description = xeroItem.description;

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        await supabase
          .from('products')
          .update(updates)
          .eq('id', xeroItemMapping.product_id);

        logger.log('Updated product from Xero item webhook:', xeroItemMapping.product_id);
      }

      // Update last synced
      await supabase
        .from('xero_items')
        .update({
          last_synced_at: new Date().toISOString(),
          sync_status: 'synced',
        })
        .eq('xero_item_id', xeroItemId);

      await supabase.from('xero_sync_log').insert({
        sync_type: 'item',
        xero_item_id: xeroItemId,
        sync_status: 'success',
        completed_at: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    logger.error('Xero item webhook handling failed:', err);
    await supabase.from('xero_sync_log').insert({
      sync_type: 'item',
      sync_status: 'failed',
      error_message: err.message,
      completed_at: new Date().toISOString(),
    });
  }
}

async function logItemSync(
  supabase: SupabaseClient,
  productId: string,
  status: string,
  errorMessage?: string
): Promise<void> {
  // Look up the xero_item_id for this product
  const { data: xeroItem } = await supabase
    .from('xero_items')
    .select('xero_item_id')
    .eq('product_id', productId)
    .single();

  await supabase.from('xero_sync_log').insert({
    sync_type: 'item',
    xero_item_id: xeroItem?.xero_item_id || null,
    sync_status: status,
    error_message: errorMessage || null,
    completed_at: new Date().toISOString(),
  });
}
