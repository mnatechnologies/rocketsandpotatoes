import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/auth/admin';
import { sendReadyForPickupEmail, sendCollectedEmail } from '@/lib/email/sendFulfillmentEmails';

const logger = createLogger('ADMIN_FULFILLMENT_UPDATE');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const VALID_TRANSITIONS: Record<string, string[]> = {
  unfulfilled: ['packing'],
  packing: ['ready_for_pickup'],
  ready_for_pickup: ['collected'],
};

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const body = await req.json();
    const { transactionId, newStatus, fulfillmentNotes } = body;

    if (!transactionId || !newStatus) {
      return NextResponse.json(
        { error: 'transactionId and newStatus are required' },
        { status: 400 }
      );
    }

    // Fetch current transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select(`
        id,
        fulfillment_status,
        customer_id,
        customer:customers!inner(first_name, last_name, email)
      `)
      .eq('id', transactionId)
      .single();

    if (fetchError || !transaction) {
      logger.error('Transaction not found:', fetchError);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Validate transition
    const currentStatus = transaction.fulfillment_status || 'unfulfilled';
    const allowedNext = VALID_TRANSITIONS[currentStatus];
    if (!allowedNext || !allowedNext.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from '${currentStatus}' to '${newStatus}'` },
        { status: 400 }
      );
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      fulfillment_status: newStatus,
      fulfilled_by: adminCheck.userId,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'ready_for_pickup') {
      updatePayload.ready_at = new Date().toISOString();
    }

    if (newStatus === 'collected') {
      updatePayload.collected_at = new Date().toISOString();
    }

    if (fulfillmentNotes) {
      updatePayload.fulfillment_notes = fulfillmentNotes;
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update(updatePayload)
      .eq('id', transactionId);

    if (updateError) {
      logger.error('Failed to update fulfillment status:', updateError);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    logger.log(`Fulfillment updated: ${transactionId} → ${newStatus}`);

    // Audit log
    await supabase.from('audit_logs').insert({
      action_type: `fulfillment_${newStatus}`,
      entity_type: 'transaction',
      entity_id: transactionId,
      description: `Fulfillment status updated to ${newStatus}`,
      metadata: {
        previous_status: currentStatus,
        new_status: newStatus,
        notes: fulfillmentNotes || null,
        admin_user_id: adminCheck.userId,
      },
      created_at: new Date().toISOString(),
    });

    // Customer email notifications (non-blocking)
    const cust = Array.isArray(transaction.customer)
      ? transaction.customer[0]
      : transaction.customer;
    const customerEmail = cust?.email;
    const customerName = cust
      ? `${cust.first_name || ''} ${cust.last_name || ''}`.trim()
      : 'Customer';

    if (customerEmail) {
      try {
        if (newStatus === 'ready_for_pickup') {
          await sendReadyForPickupEmail({
            customerEmail,
            customerName,
            orderId: transactionId,
          });
        } else if (newStatus === 'collected') {
          await sendCollectedEmail({
            customerEmail,
            customerName,
            orderId: transactionId,
          });
        }
      } catch (emailError) {
        logger.error('Failed to send fulfillment email (non-blocking):', emailError);
      }
    }

    return NextResponse.json({ success: true, newStatus });
  } catch (error) {
    logger.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
