import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBankTransferSettings } from '@/lib/bank-transfer/settings';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('BANK_TRANSFER_SETTINGS_PUBLIC');

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getBankTransferSettings();

    // Only expose non-sensitive fields to the client
    return NextResponse.json({
      enabled: settings.enabled,
      deposit_percentage: settings.deposit_percentage,
      payment_window_hours: settings.payment_window_hours,
    });
  } catch (error) {
    logger.error('Error fetching bank transfer settings:', error);
    return NextResponse.json(
      { enabled: false, deposit_percentage: 10, payment_window_hours: 24 },
      { status: 200 }
    );
  }
}
