import { NextRequest, NextResponse } from 'next/server';
import { exportPendingTTRs, markTTRsAsSubmitted, exportTTRsAsCSV } from '@/lib/compliance/ttr-generator';

export async function GET(req: NextRequest) {
  try {
    const format = req.nextUrl.searchParams.get('format') || 'json';
    const ttrRecords = await exportPendingTTRs();

    if (!ttrRecords || ttrRecords.length === 0) {
      return NextResponse.json({
        message: 'No pending TTR reports found',
        count: 0,
        records: [],
      });
    }

    // ✅ Return as CSV if requested
    if (format === 'csv') {
      const csv = exportTTRsAsCSV(ttrRecords);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="TTR_Report_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Default: Return as JSON
    return NextResponse.json({
      message: 'TTR reports retrieved successfully',
      count: ttrRecords.length,
      records: ttrRecords,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to export TTR reports' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { transactionIds, action } = await req.json();

    if (action === 'mark_submitted') {
      if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
        return NextResponse.json(
          { error: 'Transaction IDs are required' },
          { status: 400 }
        );
      }

      await markTTRsAsSubmitted(transactionIds);

      return NextResponse.json({
        success: true,
        message: `${transactionIds.length} TTR(s) marked as submitted`,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}