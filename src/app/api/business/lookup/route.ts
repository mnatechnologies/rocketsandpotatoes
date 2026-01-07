import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { lookupByABN, lookupByACN, validateABNFormat, validateACNFormat } from '@/lib/abr/abr-service';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('BUSINESS_LOOKUP_API');

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const abn = searchParams.get('abn');
  const acn = searchParams.get('acn');

  if (!abn && !acn) {
    return NextResponse.json({ error: 'ABN or ACN required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    let result;
    let lookupType: 'abn' | 'acn';
    let searchValue: string;

    if (abn) {
      if (!validateABNFormat(abn)) {
        return NextResponse.json({ error: 'Invalid ABN format' }, { status: 400 });
      }
      result = await lookupByABN(abn);
      lookupType = 'abn';
      searchValue = abn.replace(/\s/g, '');
    } else {
      if (!validateACNFormat(acn!)) {
        return NextResponse.json({ error: 'Invalid ACN format' }, { status: 400 });
      }
      result = await lookupByACN(acn!);
      lookupType = 'acn';
      searchValue = acn!.replace(/\s/g, '');
    }

    // Log the lookup for audit
    await supabase.from('abr_lookups').insert({
      abn: result.data?.abn || searchValue,
      lookup_type: lookupType,
      search_query: searchValue,
      raw_response: result.data || { error: result.error },
      entity_name: result.data?.entityName,
      entity_type: result.data?.entityType,
      entity_status: result.data?.abnStatus,
      gst_registered: result.data?.gstRegistered,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    logger.log('ABR lookup successful for:', searchValue);

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    logger.error('ABR lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup business' },
      { status: 500 }
    );
  }
}