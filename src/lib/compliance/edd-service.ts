import { createClient } from '@supabase/supabase-js';
import { sendEDDInvestigationOpenedEmail } from '@/lib/email/sendEDDEmails';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('EDD-Service');

export async function createEDDInvestigation({
 customerId,
 transactionId,
 triggerReason,
 triggeredBy = 'admin',
 adminId = null,
}: {
    customerId: string;
    transactionId?: string | null;
    triggerReason: string;
    triggeredBy?: 'admin' | 'system' | 'transaction_review';
    adminId?: string | null;
}) {
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

    // Check for existing open investigation
    const { data: existing } = await supabase
        .from('edd_investigations')
        .select('id, investigation_number')
        .eq('customer_id', customerId)
        .in('status', ['open', 'awaiting_customer_info', 'under_review', 'escalated'])
        .single();

    if (existing) {
        // If transaction provided, link it to existing investigation
        if (transactionId) {
            await supabase
                .from('transactions')
                .update({ edd_investigation_id: existing.id })
                .eq('id', transactionId);

            logger.log('Transaction linked to existing investigation:', existing.investigation_number);
        }

        return {
            success: false,
            error: 'Customer already has an active investigation',
            existingInvestigation: existing,
        };
    }

    // Create investigation
    const { data: investigation, error: createError } = await supabase
        .from('edd_investigations')
        .insert({
            customer_id: customerId,
            transaction_id: transactionId || null,
            trigger_reason: triggerReason,
            triggered_by: triggeredBy,
            triggered_by_admin_id: adminId,
            assigned_to: adminId,
            status: 'open',
        })
        .select()
        .single();

    if (createError) {
        logger.error('Failed to create investigation:', createError);
        return { success: false, error: createError.message };
    }

    // Update customer flags
    await supabase
        .from('customers')
        .update({
            requires_enhanced_dd: true,
            edd_completed: false,
            current_investigation_id: investigation.id,
        })
        .eq('id', customerId);

    // Link transaction if provided
    if (transactionId) {
        await supabase
            .from('transactions')
            .update({ edd_investigation_id: investigation.id })
            .eq('id', transactionId);
    }

    // Send email to customer
    const { data: customer } = await supabase
        .from('customers')
        .select('email, first_name, last_name')
        .eq('id', customerId)
        .single();

    if (customer?.email) {
        await sendEDDInvestigationOpenedEmail({
            customerEmail: customer.email,
            customerName: `${customer.first_name} ${customer.last_name}`,
            investigationNumber: investigation.investigation_number,
        });
    }

    // Audit log
    await supabase.from('audit_logs').insert({
        action_type: 'edd_investigation_created',
        entity_type: 'edd_investigation',
        entity_id: investigation.id,
        description: `EDD investigation created: ${triggerReason}`,
        metadata: {
            investigation_number: investigation.investigation_number,
            customer_id: customerId,
            transaction_id: transactionId,
            triggered_by: triggeredBy,
            admin_id: adminId,
        },
    });

    logger.log('✅ EDD investigation created:', investigation.investigation_number);

    return { success: true, investigation };
}