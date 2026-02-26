import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Img
} from '@react-email/components';

interface BankTransferExpiredEmailProps {
  customerName: string;
  referenceCode: string;
  holdCapturedAmount?: number;
  holdCaptured: boolean;
  marketLossAmount?: number;
}

function formatAud(amount: number): string {
  return `A$${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BankTransferExpiredEmail({
  customerName = 'John Doe',
  referenceCode = 'BT-ABC123',
  holdCapturedAmount,
  holdCaptured = false,
  marketLossAmount,
}: BankTransferExpiredEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Order Expired - {referenceCode} - Australian National Bullion</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://vlvejjyyvzrepccgmsvo.supabase.co/storage/v1/object/public/Images/anblogo.png"
              width="50"
              height="50"
              alt="Australian National Bullion"
              style={logo}
            />
          </Section>

          {/* Expired Message */}
          <Section style={expiredSection}>
            <Text style={expiredIcon}>&#10007;</Text>
            <Heading style={heading}>Order Expired</Heading>
            <Text style={paragraph}>
              Hi {customerName}, your bank transfer payment for order {referenceCode} was not received within the required timeframe. Your order has been cancelled.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Reference */}
          <Section style={referenceSection}>
            <Text style={referenceLabel}>ORDER REFERENCE</Text>
            <Text style={referenceValue}>{referenceCode}</Text>
          </Section>

          <Hr style={hr} />

          {/* Hold Captured Notice */}
          {holdCaptured && holdCapturedAmount !== undefined && holdCapturedAmount > 0 ? (
            <Section style={capturedSection}>
              <Text style={capturedHeading}>Card Hold Captured</Text>
              <Text style={capturedText}>
                An amount of {formatAud(holdCapturedAmount)} has been captured from your card hold.
              </Text>
              {marketLossAmount !== undefined && marketLossAmount > 0 && (
                <Text style={capturedText}>
                  This amount reflects the market loss of {formatAud(marketLossAmount)} incurred due to the decline in metal prices between the time of your order and its expiry, as outlined in our market loss policy.
                </Text>
              )}
              <Text style={capturedNote}>
                If you believe this charge is incorrect, please contact our support team.
              </Text>
            </Section>
          ) : (
            <Section style={releasedSection}>
              <Text style={releasedHeading}>Card Hold Released</Text>
              <Text style={releasedText}>
                The temporary card hold associated with this order has been released in full. It may take 3-5 business days for the hold to be removed from your bank statement, depending on your card issuer.
              </Text>
            </Section>
          )}

          <Hr style={hr} />

          {/* What to do next */}
          <Section style={nextStepsSection}>
            <Heading style={sectionHeading}>What Can You Do?</Heading>
            <ul style={nextStepsList}>
              <li style={nextStepsItem}>
                <strong>Place a new order:</strong> You can place a new order at any time at current market prices
              </li>
              <li style={nextStepsItem}>
                <strong>Contact us:</strong> If you have any questions or believe your payment was sent, please reach out to our support team
              </li>
            </ul>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Need help?{' '}
              <Link href="mailto:info@australiannationalbullion.com.au" style={link}>
                Contact Support
              </Link>
            </Text>
            <Text style={footerText}>
              Australian National Bullion<br />
              Sydney, Australia<br />
              AUSTRAC Registered
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '20px 30px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const expiredSection = {
  textAlign: 'center' as const,
  padding: '0 30px',
};

const expiredIcon = {
  fontSize: '64px',
  lineHeight: '1',
  margin: '16px 0',
  color: '#ef4444',
};

const heading = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#6b7280',
  margin: '0 0 16px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const referenceSection = {
  textAlign: 'center' as const,
  padding: '20px 30px',
  margin: '0 30px',
};

const referenceLabel = {
  fontSize: '12px',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  fontWeight: '600',
  margin: '0 0 8px',
  letterSpacing: '1px',
};

const referenceValue = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#6b7280',
  margin: '0',
  letterSpacing: '2px',
};

const capturedSection = {
  padding: '16px 30px',
  backgroundColor: '#ffebee',
  borderRadius: '8px',
  margin: '0 30px',
};

const capturedHeading = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#b91c1c',
  margin: '0 0 8px',
};

const capturedText = {
  fontSize: '14px',
  color: '#b91c1c',
  lineHeight: '20px',
  margin: '0 0 8px',
};

const capturedNote = {
  fontSize: '13px',
  color: '#b91c1c',
  lineHeight: '20px',
  margin: '8px 0 0',
  fontStyle: 'italic' as const,
};

const releasedSection = {
  padding: '16px 30px',
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  margin: '0 30px',
};

const releasedHeading = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1e40af',
  margin: '0 0 8px',
};

const releasedText = {
  fontSize: '14px',
  color: '#1e40af',
  lineHeight: '20px',
  margin: '0',
};

const nextStepsSection = {
  padding: '0 30px',
};

const sectionHeading = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 16px',
};

const nextStepsList = {
  margin: '12px 0',
  paddingLeft: '20px',
};

const nextStepsItem = {
  fontSize: '14px',
  color: '#4b5563',
  lineHeight: '24px',
  margin: '12px 0',
};

const footer = {
  padding: '20px 30px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e5e7eb',
  marginTop: '32px',
};

const footerText = {
  fontSize: '13px',
  color: '#6b7280',
  lineHeight: '20px',
  margin: '8px 0',
};

const link = {
  color: '#eab308',
  textDecoration: 'underline',
};
