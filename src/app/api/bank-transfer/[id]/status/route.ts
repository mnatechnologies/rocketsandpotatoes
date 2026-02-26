import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('BANK_TRANSFER_STATUS');

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  logger.log('Bank transfer status request for order:', id);

  try {
    // 1. Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch bank_transfer_order by id
    const { data: order, error: orderError } = await supabase
      .from('bank_transfer_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      logger.error('Bank transfer order not found:', orderError);
      return NextResponse.json(
        { error: 'Bank transfer order not found' },
        { status: 404 }
      );
    }

    // 3. Fetch associated transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', order.transaction_id)
      .single();

    if (txError || !transaction) {
      logger.error('Associated transaction not found:', txError);
      return NextResponse.json(
        { error: 'Associated transaction not found' },
        { status: 404 }
      );
    }

    // 4. Fetch customer and verify ownership
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, clerk_user_id, first_name, last_name, email')
      .eq('id', transaction.customer_id)
      .single();

    if (customerError || !customer) {
      logger.error('Customer not found:', customerError);
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    if (customer.clerk_user_id !== userId) {
      logger.log('Unauthorized access attempt - order does not belong to user');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 5. Build response based on status
    const status = order.status;

    if (status === 'awaiting_transfer') {
      const timeRemainingSeconds = Math.max(
        0,
        Math.floor((new Date(order.payment_deadline).getTime() - Date.now()) / 1000)
      );

      logger.log('Returning awaiting_transfer status:', {
        referenceCode: order.reference_code,
        timeRemainingSeconds,
      });

      return NextResponse.json({
        status: 'awaiting_transfer',
        referenceCode: order.reference_code,
        paymentDeadline: order.payment_deadline,
        timeRemainingSeconds,
        bankName: order.bank_name,
        bsb: order.bsb,
        accountNumber: order.account_number,
        accountName: order.account_name,
        payidIdentifier: order.payid_identifier,
        payidType: order.payid_type,
        amountAud: transaction.amount_aud,
        depositAmountAud: order.deposit_amount_aud,
      });
    }

    if (status === 'succeeded') {
      logger.log('Returning succeeded status for:', order.reference_code);
      return NextResponse.json({
        status: 'succeeded',
        referenceCode: order.reference_code,
      });
    }

    if (status === 'expired' || status === 'cancelled') {
      logger.log(`Returning ${status} status for:`, order.reference_code);
      return NextResponse.json({
        status,
        referenceCode: order.reference_code,
      });
    }

    if (status === 'hold_pending') {
      logger.log('Returning hold_pending status');
      return NextResponse.json({
        status: 'hold_pending',
      });
    }

    // Fallback for any unexpected status
    logger.warn('Unexpected order status:', status);
    return NextResponse.json({
      status,
      referenceCode: order.reference_code,
    });
  } catch (error: unknown) {
    logger.error('Error fetching bank transfer status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank transfer status' },
      { status: 500 }
    );
  }
}
