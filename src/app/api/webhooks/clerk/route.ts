import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
/* eslint-disable */

// Testing flag - set to true to enable console logging
const TESTING_MODE = process.env.TESTING_MODE === 'true' || true;

function log(...args: any[]) {
  if (TESTING_MODE) {
    console.log('[CLERK_WEBHOOK]', ...args);
  }
}

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    log('Error: Missing svix headers');
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
    log('Webhook verified successfully');
  } catch (err) {
    log('Error: Webhook verification failed', err);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
  }

  // Handle the webhook
  const eventType = evt.type;
  log('Received event type:', eventType);

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, phone_numbers } = evt.data;

    log('Processing user:', { id, email: email_addresses[0]?.email_address });

    // Create Supabase admin client with service role key (bypasses RLS)
    // NOTE: You need to add SUPABASE_SERVICE_ROLE_KEY to your .env file
    // Get this from your Supabase project settings > API > service_role key (secret)
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseServiceKey) {
      log('Error: SUPABASE_SERVICE_ROLE_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error: Missing service role key' },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    try {
      const customerData = {
        clerk_user_id: id,
        email: email_addresses[0]?.email_address || '',
        first_name: first_name || null,
        last_name: last_name || null,
        phone: phone_numbers[0]?.phone_number || null,
        verification_status: 'unverified',
        risk_level: 'low',
        risk_score: 0,
      };

      log('Customer data prepared:', customerData);

      // Upsert customer record
      const { data, error } = await supabase
        .from('customers')
        .upsert(customerData, {
          onConflict: 'clerk_user_id',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        log('Error: Supabase insert failed', error);
        return NextResponse.json({ error: 'Failed to create customer', details: error }, { status: 500 });
      }

      log('Customer record created/updated successfully:', data);

      // Log audit event
      await supabase.from('audit_logs').insert({
        action_type: eventType === 'user.created' ? 'customer_created' : 'customer_updated',
        entity_type: 'customer',
        entity_id: data[0]?.id,
        description: `User ${eventType} via Clerk webhook`,
        metadata: { clerk_user_id: id, email: customerData.email },
      });

      log('Audit log created');

      return NextResponse.json({ success: true, customer: data });
    } catch (err) {
      log('Error: Exception during processing', err);
      return NextResponse.json({ error: 'Internal server error', details: err }, { status: 500 });
    }
  }

  log('Event type not handled:', eventType);
  return NextResponse.json({ success: true, message: 'Event received but not processed' });
}
