import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireManagement } from '@/lib/auth/admin';

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

// GET: Fetch current pricing configuration (PUBLIC - no auth required for reading)
export async function GET(req: NextRequest) {
  try {
    // Fetch pricing config (there should only be one row)
    const { data, error } = await supabase
      .from('pricing_config')
      .select('markup_percentage, default_base_fee_percentage, brand_base_fee_percentages')
      .single();

    if (error) {
      console.error('Error fetching pricing config:', error);
      // Return defaults if not found
      return NextResponse.json({
        success: true,
        data: {
          markup_percentage: 10,
          default_base_fee_percentage: 2,
          brand_base_fee_percentages: {},
        }
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in GET /api/admin/pricing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update pricing configuration
export async function PUT(req: NextRequest) {
  try {
    // Verify management authorization (admin or manager)
    const authCheck = await requireManagement();
    if (!authCheck.authorized) return authCheck.error;

    const userId = authCheck.userId;

    const body = await req.json();
    const { markup_percentage, default_base_fee_percentage, brand_base_fee_percentages } = body;

    // Validate inputs
    if (markup_percentage !== undefined) {
      if (typeof markup_percentage !== 'number' || markup_percentage < 0 || markup_percentage > 100) {
        return NextResponse.json(
          { error: 'Invalid markup_percentage: must be between 0 and 100' },
          { status: 400 }
        );
      }
    }

    if (default_base_fee_percentage !== undefined) {
      if (typeof default_base_fee_percentage !== 'number' || default_base_fee_percentage < 0 || default_base_fee_percentage > 100) {
        return NextResponse.json(
          { error: 'Invalid default_base_fee_percentage: must be between 0 and 100' },
          { status: 400 }
        );
      }
    }

    if (brand_base_fee_percentages !== undefined) {
      if (typeof brand_base_fee_percentages !== 'object' || Array.isArray(brand_base_fee_percentages)) {
        return NextResponse.json(
          { error: 'Invalid brand_base_fee_percentages: must be an object' },
          { status: 400 }
        );
      }

      // Validate all brand fee percentages are valid
      for (const [brand, fee] of Object.entries(brand_base_fee_percentages)) {
        if (typeof fee !== 'number' || (fee as number) < 0 || (fee as number) > 100) {
          return NextResponse.json(
            { error: `Invalid fee percentage for brand "${brand}": must be between 0 and 100` },
            { status: 400 }
          );
        }
      }
    }

    // Build update object (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (markup_percentage !== undefined) updateData.markup_percentage = markup_percentage;
    if (default_base_fee_percentage !== undefined) updateData.default_base_fee_percentage = default_base_fee_percentage;
    if (brand_base_fee_percentages !== undefined) updateData.brand_base_fee_percentages = brand_base_fee_percentages;

    // Get the single pricing config row (there should only be one)
    const { data: existing } = await supabase
      .from('pricing_config')
      .select('id')
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Pricing configuration not found' },
        { status: 404 }
      );
    }

    // Update the pricing config
    const { data, error } = await supabase
      .from('pricing_config')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pricing config:', error);
      return NextResponse.json(
        { error: 'Failed to update pricing configuration' },
        { status: 500 }
      );
    }

    // Log the change to audit logs
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'update_pricing_config',
      details: updateData,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in PUT /api/admin/pricing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
