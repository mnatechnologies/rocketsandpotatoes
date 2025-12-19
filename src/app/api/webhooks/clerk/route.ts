import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { screenCustomer } from "@/lib/compliance/screening";

/* eslint-disable */

const logger = createLogger('CLERK_WEBHOOK');

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    logger.error('Error: Missing svix headers');
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
    logger.log('Webhook verified successfully');
  } catch (err) {
    logger.error('Error: Webhook verification failed', err);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
  }

  // Handle the webhook
  const eventType = evt.type;
  logger.log('Received event type:', eventType);

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, phone_numbers } = evt.data;

    logger.log('Processing user:', { id, email: email_addresses[0]?.email_address });


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

      logger.log('Customer data prepared:', customerData);

      // Insert customer record
      const { data, error } = await supabase
        .from('customers')
        .upsert(customerData, {
          onConflict: 'clerk_user_id',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        logger.error('Error: Supabase insert failed', error);
        return NextResponse.json({ error: 'Failed to create customer', details: error }, { status: 500 });
      }

      logger.log('Customer record created/updated successfully:', data);


      // Log audit event
      await supabase.from('audit_logs').insert({
        action_type: eventType === 'user.created' ? 'customer_created' : 'customer_updated',
        entity_type: 'customer',
        entity_id: data[0]?.id,
        description: `User ${eventType} via Clerk webhook`,
        metadata: { clerk_user_id: id, email: customerData.email },
      });

      logger.log('Audit log created');

      return NextResponse.json({ success: true, customer: data });
    } catch (err) {
      logger.error('Error: Exception during processing', err);
      return NextResponse.json({ error: 'Internal server error', details: err }, { status: 500 });
    }
  }

  logger.log('Event type not handled:', eventType);
  return NextResponse.json({ success: true, message: 'Event received but not processed' });
}
