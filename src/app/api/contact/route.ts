import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/ses';
import { createLogger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';

const logger = createLogger('CONTACT_API');

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

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ContactFormData = await req.json();
    const { name, email, phone, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Store inquiry in database
    const { error: dbError } = await supabase
      .from('enquiries')
      .insert({
        name,
        email,
        phone: phone || null,
        message: `Subject: ${subject}\n\n${message}`,
      });

    if (dbError) {
      logger.error('Failed to store inquiry in database:', dbError);
      // Continue even if DB fails - still send email
    }

    // Send email notification to support team
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.SES_FROM_EMAIL;

    if (!supportEmail) {
      logger.error('SUPPORT_EMAIL not configured');
      return NextResponse.json(
        { error: 'Email service not properly configured' },
        { status: 500 }
      );
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937; border-bottom: 2px solid #eab308; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>

        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>From:</strong> ${name}</p>
          <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          ${phone ? `<p style="margin: 8px 0;"><strong>Phone:</strong> ${phone}</p>` : ''}
          <p style="margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
        </div>

        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="color: #1f2937; margin-top: 0;">Message:</h3>
          <p style="white-space: pre-wrap; color: #374151; line-height: 1.6;">${message}</p>
        </div>

        <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #eab308; border-radius: 4px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Reply to this inquiry at:</strong> <a href="mailto:${email}" style="color: #92400e;">${email}</a>
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          Sent via Australian National Bullion Contact Form<br>
          ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })} AEST
        </p>
      </div>
    `;

    // Send to support team
    const emailResult = await sendEmail({
      to: supportEmail,
      subject: `Contact Form: ${subject}`,
      html,
    });

    if (!emailResult.success) {
      logger.error('Failed to send contact email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email. Please try again later.' },
        { status: 500 }
      );
    }

    // Send confirmation email to customer
    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Thank you for contacting us!</h2>

        <p>Dear ${name},</p>

        <p>We've received your message and will get back to you within 24 hours.</p>

        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
          <p style="margin: 8px 0; color: #6b7280; font-size: 14px;">
            Your inquiry has been logged and assigned to our support team.
          </p>
        </div>

        <p>If you have any urgent questions, please don't hesitate to reach out again.</p>

        <p>Best regards,<br>
        Australian National Bullion Team</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #6b7280; font-size: 12px;">
          Australian National Bullion<br>
          AUSTRAC Registered Precious Metals Dealer<br>
          <a href="mailto:${supportEmail}">${supportEmail}</a>
        </p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: 'We received your message - Australian National Bullion',
      html: confirmationHtml,
    });

    logger.log('Contact form processed successfully:', { name, email, subject });

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully',
    });

  } catch (error: any) {
    logger.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
