import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email/sendOrderConfirmation';

export async function POST(req: NextRequest) {
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
    console.error('[SEND_EMAIL_API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}