import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { refreshAllSanctionsLists } from '@/lib/compliance/sanctions-ingestion';
import { rescreenAllCustomers } from '@/lib/compliance/screening';
import { sendComplianceAlert } from '@/lib/email/sendComplianceAlert';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('CRON_REFRESH_SANCTIONS');

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';

  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !isVercelCron) {
    logger.warn('Unauthorized cron job access attempt.');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (!cronSecret && !isVercelCron && process.env.NODE_ENV === 'production') {
    logger.warn('Cron endpoint called without authorization in production');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  logger.log('Sanctions list refresh cron job started...');

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
    // Refresh both sanctions lists
    const refreshResult = await refreshAllSanctionsLists();

    const dfatErrors = refreshResult.dfat.errors;
    const unErrors = refreshResult.un.errors;
    const allErrors = [...dfatErrors, ...unErrors];

    logger.log(
      `Refresh complete — DFAT: ${refreshResult.dfat.inserted} inserted / ${refreshResult.dfat.deleted} deleted,` +
      ` UN: ${refreshResult.un.inserted} inserted / ${refreshResult.un.deleted} deleted`
    );

    // Re-screen all customers against the freshly loaded data
    let rescreenResult: Awaited<ReturnType<typeof rescreenAllCustomers>> | null = null;
    try {
      rescreenResult = await rescreenAllCustomers();
      logger.log(
        `Re-screen complete — ${rescreenResult.screened} screened, ${rescreenResult.newMatches} new matches`
      );
    } catch (rescreenErr) {
      const msg = rescreenErr instanceof Error ? rescreenErr.message : String(rescreenErr);
      logger.error('Re-screening after sanctions refresh failed:', rescreenErr);
      allErrors.push(`Re-screen failed: ${msg}`);
    }

    // Send completion alert
    const totalInserted = refreshResult.dfat.inserted + refreshResult.un.inserted;
    await sendComplianceAlert({
      type: 'sanctions_list_refreshed',
      severity: allErrors.length > 0 ? 'high' : 'low',
      title: 'Sanctions Lists Refreshed',
      description:
        `Weekly sanctions list refresh completed. ` +
        `DFAT: ${refreshResult.dfat.inserted} entries. ` +
        `UN: ${refreshResult.un.inserted} entries. ` +
        `Total: ${totalInserted}.` +
        (rescreenResult
          ? ` Re-screen: ${rescreenResult.screened} customers, ${rescreenResult.newMatches} new matches.`
          : '') +
        (allErrors.length > 0 ? ` Errors: ${allErrors.join('; ')}` : ''),
      metadata: {
        dfat: refreshResult.dfat,
        un: refreshResult.un,
        rescreen: rescreenResult ?? null,
        errors: allErrors,
      },
      actionUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/audit-logs`,
    });

    // Audit log
    await supabase.from('audit_logs').insert({
      action_type: 'sanctions_refresh_cron_completed',
      entity_type: 'system',
      description: `Sanctions lists refreshed — ${totalInserted} total entries loaded`,
      metadata: {
        dfat: refreshResult.dfat,
        un: refreshResult.un,
        rescreen: rescreenResult,
        errors: allErrors,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sanctions lists refreshed successfully',
      result: {
        dfat: {
          inserted: refreshResult.dfat.inserted,
          deleted: refreshResult.dfat.deleted,
          errors: dfatErrors,
        },
        un: {
          inserted: refreshResult.un.inserted,
          deleted: refreshResult.un.deleted,
          errors: unErrors,
        },
        rescreen: rescreenResult
          ? {
              totalCustomers: rescreenResult.totalCustomers,
              screened: rescreenResult.screened,
              newMatches: rescreenResult.newMatches,
              errors: rescreenResult.errors,
            }
          : null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Sanctions refresh cron job failed:', error);

    await supabase.from('audit_logs').insert({
      action_type: 'sanctions_refresh_cron_failed',
      entity_type: 'system',
      description: `Sanctions list refresh failed: ${message}`,
      metadata: { error: message },
    });

    return NextResponse.json(
      { success: false, message: 'Sanctions refresh failed', error: message },
      { status: 500 }
    );
  }
}
