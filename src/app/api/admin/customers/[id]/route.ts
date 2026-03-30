import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';
import { createLogger } from '@/lib/utils/logger';
import { screenCustomer } from '@/lib/compliance/screening';

const logger = createLogger('ADMIN_CUSTOMER_DETAIL');

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const { id } = await params;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    // Fetch customer base record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(
        `
        id,
        clerk_user_id,
        email,
        first_name,
        last_name,
        source_of_funds,
        occupation,
        employer,
        verification_status,
        verification_level,
        monitoring_level,
        requires_enhanced_dd,
        is_pep,
        is_sanctioned,
        risk_score,
        risk_level,
        customer_type,
        created_at
        `
      )
      .eq('id', id)
      .single();

    if (customerError || !customer) {
      logger.error('Customer not found:', customerError);
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Parallel fetches for all related data
    const [
      transactionsResult,
      verificationsResult,
      eddResult,
      sanctionsResult,
      adminNotesResult,
    ] = await Promise.all([
      supabase
        .from('transactions')
        .select(
          `
          id,
          amount,
          amount_aud,
          currency,
          payment_status,
          payment_method_type,
          product_details,
          fulfillment_status,
          created_at
          `
        )
        .eq('customer_id', id)
        .order('created_at', { ascending: false }),

      supabase
        .from('identity_verifications')
        .select('id, verification_type, status, created_at')
        .eq('customer_id', id)
        .order('created_at', { ascending: false }),

      supabase
        .from('edd_investigations')
        .select('id, status, created_at')
        .eq('customer_id', id)
        .order('created_at', { ascending: false }),

      supabase
        .from('sanctions_screenings')
        .select('id, is_match, match_score, screened_name, screening_service, status, screening_type, created_at')
        .eq('customer_id', id)
        .order('created_at', { ascending: false }),

      supabase
        .from('audit_logs')
        .select('id, description, metadata, created_at')
        .eq('entity_type', 'customer')
        .eq('entity_id', id)
        .eq('action_type', 'admin_note_added')
        .order('created_at', { ascending: false }),
    ]);

    return NextResponse.json({
      customer,
      transactions: transactionsResult.data || [],
      identity_verifications: verificationsResult.data || [],
      edd_investigations: eddResult.data || [],
      sanctions_screenings: sanctionsResult.data || [],
      admin_notes: (adminNotesResult.data || []).map((n) => ({
        text: n.description,
        admin_id: (n.metadata as Record<string, unknown>)?.admin_clerk_id || 'unknown',
        created_at: n.created_at,
      })),
    });
  } catch (error) {
    logger.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const VALID_VERIFICATION_STATUSES = ['verified', 'pending', 'rejected', 'unverified'] as const;
const VALID_RISK_LEVELS = ['low', 'medium', 'high'] as const;
const VALID_ACTIONS = ['update_verification', 'update_risk_level', 'rescreen', 'add_note'] as const;

type PatchAction = typeof VALID_ACTIONS[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  const { id } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
  }

  try {
    const body = await req.json() as { action: PatchAction; value?: string; reason?: string; note?: string };
    const { action, value, reason, note } = body;

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Verify customer exists
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('id, first_name, last_name')
      .eq('id', id)
      .single();

    if (fetchError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (action === 'update_verification') {
      if (!value || !VALID_VERIFICATION_STATUSES.includes(value as typeof VALID_VERIFICATION_STATUSES[number])) {
        return NextResponse.json({ error: 'Invalid verification_status value' }, { status: 400 });
      }
      if (!reason?.trim()) {
        return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
      }

      const { error: updateError } = await supabase
        .from('customers')
        .update({ verification_status: value })
        .eq('id', id);

      if (updateError) {
        logger.error('Failed to update verification_status:', updateError);
        return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
      }

      await supabase.from('audit_logs').insert({
        action_type: 'admin_kyc_override',
        entity_type: 'customer',
        entity_id: id,
        description: `KYC status overridden to '${value}' by admin`,
        metadata: {
          new_status: value,
          reason,
          admin_clerk_id: adminCheck.userId,
        },
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'update_risk_level') {
      if (!value || !VALID_RISK_LEVELS.includes(value as typeof VALID_RISK_LEVELS[number])) {
        return NextResponse.json({ error: 'Invalid risk_level value' }, { status: 400 });
      }
      if (!reason?.trim()) {
        return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
      }

      const { error: updateError } = await supabase
        .from('customers')
        .update({ risk_level: value })
        .eq('id', id);

      if (updateError) {
        logger.error('Failed to update risk_level:', updateError);
        return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
      }

      await supabase.from('audit_logs').insert({
        action_type: 'admin_risk_level_override',
        entity_type: 'customer',
        entity_id: id,
        description: `Risk level overridden to '${value}' by admin`,
        metadata: {
          new_risk_level: value,
          reason,
          admin_clerk_id: adminCheck.userId,
        },
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'rescreen') {
      const result = await screenCustomer(id);

      await supabase.from('audit_logs').insert({
        action_type: 'admin_sanctions_rescreen',
        entity_type: 'customer',
        entity_id: id,
        description: `Sanctions re-screen triggered by admin`,
        metadata: {
          is_match: result.isMatch,
          match_count: result.matches.length,
          admin_clerk_id: adminCheck.userId,
        },
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        result: {
          isMatch: result.isMatch,
          matches: result.matches,
          screenedAt: result.screenedAt,
          screenedName: result.screenedName,
        },
      });
    }

    if (action === 'add_note') {
      if (!note?.trim()) {
        return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
      }

      const { error: insertError } = await supabase.from('audit_logs').insert({
        action_type: 'admin_note_added',
        entity_type: 'customer',
        entity_id: id,
        description: note.trim(),
        metadata: {
          admin_clerk_id: adminCheck.userId,
        },
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        logger.error('Failed to add admin note:', insertError);
        return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    logger.error('Unexpected error in PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
