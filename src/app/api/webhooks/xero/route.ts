import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('XERO_WEBHOOK');

// Xero webhooks support CONTACT, INVOICE, and SUBSCRIPTION event categories only.
// No ITEM events are available. This endpoint handles intent-to-receive validation
// and logs received events for future use (e.g., invoice status changes).

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-xero-signature');
  const body = await req.text();

  // Compute expected HMAC-SHA256 signature
  const hmac = crypto.createHmac('sha256', process.env.XERO_WEBHOOK_KEY!);
  hmac.update(body);
  const expectedSignature = hmac.digest('base64');

  // Timing-safe signature comparison
  // Xero requires 401 for invalid signatures (intent-to-receive validation)
  if (
    !signature ||
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  ) {
    return new NextResponse(null, { status: 401 });
  }

  // If body is empty or has no events, this is an intent-to-receive handshake
  if (!body || body.trim() === '') {
    return NextResponse.json({ received: true });
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    logger.error('Failed to parse Xero webhook body');
    return NextResponse.json({ received: true });
  }

  if (!payload.events || payload.events.length === 0) {
    return NextResponse.json({ received: true });
  }

  // Log received events for visibility
  for (const event of payload.events) {
    logger.log('Xero webhook event:', {
      category: event.eventCategory,
      type: event.eventType,
      resourceId: event.resourceId,
      tenantId: event.tenantId,
    });
  }

  return NextResponse.json({ received: true });
}
