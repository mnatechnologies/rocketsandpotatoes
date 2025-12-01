import { NextRequest, NextResponse } from 'next/server';
import { fetchFxRate } from '@/lib/metals-api/metalsApi';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('FX_RATE_API');

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters: from and to' },
        { status: 400 }
      );
    }

    logger.log(`Fetching FX rate: ${from} → ${to}`);

    const result = await fetchFxRate(from, to);

    return NextResponse.json({
      success: true,
      from,
      to,
      rate: result.rate,
      timestamp: result.timestamp,
    });
  } catch (error) {
    logger.error('Error fetching FX rate:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch FX rate',
      },
      { status: 500 }
    );
  }
}