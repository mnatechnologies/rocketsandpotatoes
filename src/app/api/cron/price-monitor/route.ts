import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchMetalsQuotes, type MetalSymbol } from '@/lib/metals-api/metalsApi';
import { sendEmail } from '@/lib/email/ses';
import { sendAdminAlertSMS } from '@/lib/notifications/sns';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('PRICE_MONITOR');

const METALS: MetalSymbol[] = ['XAU', 'XAG', 'XPT', 'XPD'];

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

interface HaltTriggered {
  metal_type: MetalSymbol;
  drop_pct: number;
  oldest_price: number;
  current_price: number;
  window_minutes: number;
}

export async function GET(req: NextRequest) {
  // Verify cron authorization
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';

  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!cronSecret && !isVercelCron && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // =========================================================================
    // Step 1: Fetch current spot prices from MetalPriceAPI (USD)
    // =========================================================================
    logger.log('Fetching spot prices for', METALS.join(', '));

    let quotes;
    try {
      quotes = await fetchMetalsQuotes({
        baseCurrency: 'USD',
        symbols: METALS,
      });
    } catch (fetchError) {
      logger.error('Failed to fetch spot prices:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch spot prices' },
        { status: 500 }
      );
    }

    // Build price map: metal -> USD price per troy ounce
    const priceMap: Record<string, number> = {};
    for (const quote of quotes) {
      priceMap[quote.symbol] = quote.price;
    }

    logger.log('Spot prices fetched:', priceMap);

    // =========================================================================
    // Step 2: Store price snapshots
    // =========================================================================
    const snapshots = METALS
      .filter((metal) => priceMap[metal] !== undefined)
      .map((metal) => ({
        metal_type: metal,
        price_usd: priceMap[metal],
        captured_at: new Date().toISOString(),
      }));

    const { error: snapshotError } = await supabase
      .from('price_snapshots')
      .insert(snapshots);

    if (snapshotError) {
      logger.error('Failed to insert price snapshots:', snapshotError);
      // Continue anyway - threshold evaluation can still use existing snapshots
    } else {
      logger.log('Price snapshots stored for', METALS.length, 'metals');
    }

    // =========================================================================
    // Step 3: Evaluate auto-halt thresholds
    // =========================================================================
    const { data: configs, error: configError } = await supabase
      .from('sales_halt_config')
      .select('*');

    if (configError) {
      logger.error('Failed to fetch halt configs:', configError);
      return NextResponse.json(
        { success: false, error: 'Price monitor failed' },
        { status: 500 }
      );
    }

    const { data: haltStates, error: haltError } = await supabase
      .from('sales_halt')
      .select('*')
      .in('metal_type', METALS);

    if (haltError) {
      logger.error('Failed to fetch halt states:', haltError);
      return NextResponse.json(
        { success: false, error: 'Price monitor failed' },
        { status: 500 }
      );
    }

    const haltStateMap = new Map(
      (haltStates || []).map((h: { metal_type: string; is_halted: boolean; id: string }) => [h.metal_type, h])
    );

    const haltsTriggered: HaltTriggered[] = [];

    for (const config of configs || []) {
      if (!config.enabled) {
        logger.log(`Auto-halt disabled for ${config.metal_type}, skipping`);
        continue;
      }

      const metal = config.metal_type as MetalSymbol;
      const currentPrice = priceMap[metal];

      if (currentPrice === undefined) {
        logger.error(`No current price for ${metal}, skipping threshold check`);
        continue;
      }

      try {
        // Query the oldest snapshot within the check window
        const windowStart = new Date(
          Date.now() - config.check_window_minutes * 60 * 1000
        ).toISOString();

        const { data: oldestSnapshot, error: snapError } = await supabase
          .from('price_snapshots')
          .select('price_usd')
          .eq('metal_type', metal)
          .gte('captured_at', windowStart)
          .order('captured_at', { ascending: true })
          .limit(1)
          .single();

        if (snapError || !oldestSnapshot) {
          logger.log(
            `No snapshots in window for ${metal} (window: ${config.check_window_minutes}min), skipping`
          );
          continue;
        }

        const oldestPrice = Number(oldestSnapshot.price_usd);
        const dropPct =
          ((oldestPrice - currentPrice) / oldestPrice) * 100;

        logger.log(
          `${metal}: oldest=${oldestPrice.toFixed(2)}, current=${currentPrice.toFixed(2)}, drop=${dropPct.toFixed(2)}%, threshold=${config.drop_threshold_pct}%`
        );

        if (dropPct < config.drop_threshold_pct) {
          continue;
        }

        // Check if already halted
        const haltState = haltStateMap.get(metal) as { is_halted: boolean; id: string } | undefined;
        if (haltState?.is_halted) {
          logger.log(`${metal} already halted, skipping`);
          continue;
        }

        // Trigger halt
        const roundedDrop = Math.round(dropPct * 100) / 100;
        const haltReason = `${metal} dropped ${roundedDrop}% in ${config.check_window_minutes}min (${oldestPrice.toFixed(2)} -> ${currentPrice.toFixed(2)})`;

        logger.log(`TRIGGERING HALT: ${haltReason}`);

        const { error: haltUpdateError } = await supabase
          .from('sales_halt')
          .update({
            is_halted: true,
            halted_at: new Date().toISOString(),
            halted_by: 'auto',
            halt_reason: haltReason,
            resumed_at: null,
            resumed_by: null,
            updated_at: new Date().toISOString(),
          })
          .eq('metal_type', metal);

        if (haltUpdateError) {
          logger.error(`Failed to halt ${metal}:`, haltUpdateError);
          continue;
        }

        // Insert audit log
        const { error: auditError } = await supabase.from('audit_logs').insert({
          action_type: 'sales_halt',
          entity_type: 'sales_halt',
          entity_id: haltState?.id || null,
          description: `Sales auto-halted for ${metal}: ${haltReason}`,
          metadata: {
            trigger: 'auto',
            metal_type: metal,
            drop_pct: roundedDrop,
            oldest_price: oldestPrice,
            current_price: currentPrice,
            window_minutes: config.check_window_minutes,
          },
          user_agent: 'system/cron/price-monitor',
          created_at: new Date().toISOString(),
        });

        if (auditError) {
          logger.error(`Failed to write audit log for ${metal} halt:`, auditError);
        }

        haltsTriggered.push({
          metal_type: metal,
          drop_pct: roundedDrop,
          oldest_price: oldestPrice,
          current_price: currentPrice,
          window_minutes: config.check_window_minutes,
        });

        // Send notifications (failures should not prevent halt from taking effect)
        await sendHaltNotifications(
          metal,
          roundedDrop,
          oldestPrice,
          currentPrice,
          config.check_window_minutes
        );
      } catch (metalError) {
        logger.error(`Error evaluating threshold for ${metal}:`, metalError);
        // Continue processing other metals
      }
    }

    // =========================================================================
    // Step 4: Cleanup stale snapshots (older than 24 hours)
    // =========================================================================
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: snapshotsCleaned, error: cleanupError } = await supabase
      .from('price_snapshots')
      .delete({ count: 'exact' })
      .lt('captured_at', cutoff);

    if (cleanupError) {
      logger.error('Failed to cleanup old snapshots:', cleanupError);
    } else {
      logger.log(`Cleaned up ${snapshotsCleaned || 0} old snapshots`);
    }

    // =========================================================================
    // Return structured summary
    // =========================================================================
    const response = {
      success: true,
      data: {
        prices_captured: priceMap,
        halts_triggered: haltsTriggered,
        snapshots_cleaned: snapshotsCleaned,
        evaluated_at: new Date().toISOString(),
      },
    };

    logger.log('Price monitor completed:', JSON.stringify(response.data));

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Price monitor failed:', error);
    return NextResponse.json(
      { success: false, error: 'Price monitor failed' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Notification helpers
// =============================================================================

async function sendHaltNotifications(
  metal: MetalSymbol,
  dropPct: number,
  oldestPrice: number,
  currentPrice: number,
  windowMinutes: number
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://admin.australiannationalbullion.com.au';

  // Send email via SES
  try {
    const adminEmails = (process.env.ADMIN_ALERT_EMAILS || '')
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (adminEmails.length > 0) {
      const subject = `[ALERT] Sales halted for ${metal} - ${dropPct}% price drop detected`;
      const html = buildHaltEmailHtml(
        metal,
        dropPct,
        oldestPrice,
        currentPrice,
        windowMinutes,
        baseUrl
      );

      const result = await sendEmail({ to: adminEmails, subject, html });
      if (result.success) {
        logger.log(`Halt email sent to ${adminEmails.length} recipients`);
      } else {
        logger.error('Failed to send halt email:', result.error);
      }
    } else {
      logger.warn('No ADMIN_ALERT_EMAILS configured, skipping email notification');
    }
  } catch (emailError) {
    logger.error('Email notification error (halt still active):', emailError);
  }

  // Send SMS via SNS
  try {
    const smsMessage = `ANB ALERT: ${metal} sales auto-halted. ${dropPct}% drop in ${windowMinutes}min. Login to resume: ${baseUrl}/admin/sales-control`;

    const smsResult = await sendAdminAlertSMS(smsMessage);
    if (smsResult.sent > 0) {
      logger.log(`Halt SMS sent to ${smsResult.sent} recipients`);
    }
    if (smsResult.failed > 0) {
      logger.error(`Failed to send halt SMS to ${smsResult.failed} recipients`);
    }
  } catch (smsError) {
    logger.error('SMS notification error (halt still active):', smsError);
  }
}

function buildHaltEmailHtml(
  metal: MetalSymbol,
  dropPct: number,
  oldestPrice: number,
  currentPrice: number,
  windowMinutes: number,
  baseUrl: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Sales Auto-Halted</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px; color: #374151;">
          An automatic sales halt has been triggered for <strong>${metal}</strong> due to a significant price drop.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Metal</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${metal}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Price Drop</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #dc2626;">${dropPct}%</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">From</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">$${oldestPrice.toFixed(2)} USD</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">To</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">$${currentPrice.toFixed(2)} USD</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Time Window</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${windowMinutes} minutes</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Triggered At</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${new Date().toISOString()}</td>
          </tr>
        </table>
        <p style="color: #374151;">
          Sales for ${metal} products have been automatically halted. A manual review is required to resume sales.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${baseUrl}/admin/sales-control"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Review &amp; Resume Sales
          </a>
        </div>
      </div>
      <div style="padding: 12px 20px; background: #f9fafb; color: #6b7280; font-size: 12px; text-align: center;">
        Australian National Bullion - Automated Price Alert
      </div>
    </div>
  `;
}
