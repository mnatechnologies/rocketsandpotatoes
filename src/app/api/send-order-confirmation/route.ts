import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email/sendOrderConfirmation';
import { createLogger } from '@/lib/utils/logger';
import { auth } from '@clerk/nextjs/server';

const logger = createLogger('SEND_EMAIL_API');

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const {
      orderNumber,
      customerName,
      customerEmail,
      orderDate,
      items,
      subtotal,
      total,
      currency,
      paymentMethod,
      requiresKYC,
      requiresTTR,
    } = body;

    // Validate required fields
    if (!orderNumber || !customerEmail || !items || !total) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send email
    const result = await sendOrderConfirmationEmail({
      orderNumber,
      customerName,
      customerEmail,
      orderDate,
      items,
      subtotal,
      total,
      currency,
      paymentMethod,
      requiresKYC,
      requiresTTR,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, emailId: result.emailId });
  } catch (error: any) {
    logger.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}