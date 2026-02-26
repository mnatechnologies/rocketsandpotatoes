import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/auth/admin';

const logger = createLogger('ADMIN_BANK_TRANSFER_LIST');

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

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

  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    logger.log('Admin listing bank transfer orders:', { statusFilter });

    // Validate status filter if provided
    const validStatuses = ['awaiting_transfer', 'succeeded', 'expired', 'cancelled', 'hold_pending'];
    if (statusFilter && !validStatuses.includes(statusFilter)) {
      return NextResponse.json(
        { error: `Invalid status filter. Valid values: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Build query: fetch bank_transfer_orders with joined transaction and customer data
    let query = supabase
      .from('bank_transfer_orders')
      .select(`
        *,
        transaction:transactions(
          id,
          customer_id,
          amount,
          amount_aud,
          currency,
          payment_status,
          product_type,
          product_details,
          metadata,
          created_at,
          customer:customers(
            id,
            first_name,
            last_name,
            email
          )
        )
      `);

    // Apply status filter if provided
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data: orders, error: queryError } = await query;

    if (queryError) {
      logger.error('Failed to fetch bank transfer orders:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch bank transfer orders' },
        { status: 500 }
      );
    }

    if (!orders) {
      return NextResponse.json({ data: [] });
    }

    // Sort: awaiting_transfer by payment_deadline ASC (most urgent first),
    // others by updated_at DESC
    const sorted = orders.sort((a, b) => {
      // awaiting_transfer orders come first, sorted by deadline (most urgent first)
      if (a.status === 'awaiting_transfer' && b.status !== 'awaiting_transfer') {
        return -1;
      }
      if (a.status !== 'awaiting_transfer' && b.status === 'awaiting_transfer') {
        return 1;
      }
      if (a.status === 'awaiting_transfer' && b.status === 'awaiting_transfer') {
        return new Date(a.payment_deadline).getTime() - new Date(b.payment_deadline).getTime();
      }
      // All other statuses sorted by updated_at DESC
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    // Flatten the nested joins for easier frontend consumption
    const formattedOrders = sorted.map((order) => {
      // Supabase joins can return arrays for 1:1 relations
      const transaction = Array.isArray(order.transaction)
        ? order.transaction[0]
        : order.transaction;

      const customer = transaction
        ? (Array.isArray(transaction.customer) ? transaction.customer[0] : transaction.customer)
        : null;

      return {
        id: order.id,
        reference_code: order.reference_code,
        status: order.status,
        hold_status: order.hold_status,
        deposit_percentage: order.deposit_percentage,
        deposit_amount_aud: order.deposit_amount_aud,
        hold_captured_amount: order.hold_captured_amount,
        hold_capture_reason: order.hold_capture_reason,
        bank_name: order.bank_name,
        bsb: order.bsb,
        account_number: order.account_number,
        account_name: order.account_name,
        payid_identifier: order.payid_identifier,
        payid_type: order.payid_type,
        payment_deadline: order.payment_deadline,
        confirmed_at: order.confirmed_at,
        confirmed_by: order.confirmed_by,
        confirmation_notes: order.confirmation_notes,
        customer_transfer_ref: order.customer_transfer_ref,
        created_at: order.created_at,
        updated_at: order.updated_at,
        // Transaction data
        transaction_id: transaction?.id || null,
        amount: transaction?.amount || null,
        amount_aud: transaction?.amount_aud || null,
        currency: transaction?.currency || null,
        payment_status: transaction?.payment_status || null,
        product_type: transaction?.product_type || null,
        product_details: transaction?.product_details || null,
        // Customer data
        customer_id: customer?.id || null,
        customer_name: customer
          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
          : null,
        customer_email: customer?.email || null,
        // Xero matching data
        xero_match_status: order.xero_match_status || null,
        xero_matched_at: order.xero_matched_at || null,
        xero_match_amount: order.xero_match_amount || null,
        xero_bank_transaction_id: order.xero_bank_transaction_id || null,
      };
    });

    logger.log('Returning bank transfer orders:', {
      count: formattedOrders.length,
      statusFilter,
    });

    return NextResponse.json({ data: formattedOrders });
  } catch (error: unknown) {
    logger.error('Error listing bank transfer orders:', error);
    return NextResponse.json(
      { error: 'Failed to list bank transfer orders' },
      { status: 500 }
    );
  }
}
