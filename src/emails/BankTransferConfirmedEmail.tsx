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

interface BankTransferConfirmedEmailProps {
  customerName: string;
  referenceCode: string;
  amountAud: number;
}

function formatAud(amount: number): string {
  return `A$${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BankTransferConfirmedEmail({
  customerName = 'John Doe',
  referenceCode = 'BT-ABC123',
  amountAud = 0,
}: BankTransferConfirmedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Payment Confirmed - {referenceCode} - Australian National Bullion</Preview>
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

          {/* Success Message */}
          <Section style={successSection}>
            <Text style={successIcon}>&#10003;</Text>
            <Heading style={heading}>Payment Confirmed!</Heading>
            <Text style={paragraph}>
              Hi {customerName}, your bank transfer of {formatAud(amountAud)} has been received and confirmed.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Reference */}
          <Section style={referenceSection}>
            <Text style={referenceLabel}>ORDER REFERENCE</Text>
            <Text style={referenceValue}>{referenceCode}</Text>
          </Section>

          <Hr style={hr} />

          {/* Hold Released */}
          <Section style={holdReleasedSection}>
            <Text style={holdReleasedHeading}>Card Hold Released</Text>
            <Text style={holdReleasedText}>
              The temporary card hold associated with this order has been released. It may take 3-5 business days for the hold to be removed from your bank statement, depending on your card issuer.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Next Steps */}
          <Section style={nextStepsSection}>
            <Heading style={sectionHeading}>What Happens Next?</Heading>
            <ul style={nextStepsList}>
              <li style={nextStepsItem}>
                <strong>1. Order Processing:</strong> We&#39;ll prepare your order for pickup
              </li>
              <li style={nextStepsItem}>
                <strong>2. Pickup Notification:</strong> You&#39;ll receive an email when your order is ready
              </li>
              <li style={nextStepsItem}>
                <strong>3. Collection:</strong> Pick up your order at our secure location with valid ID
              </li>
            </ul>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Questions about your order?{' '}
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

const successSection = {
  textAlign: 'center' as const,
  padding: '0 30px',
};

const successIcon = {
  fontSize: '64px',
  lineHeight: '1',
  margin: '16px 0',
  color: '#10b981',
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
  backgroundColor: '#e8f5e9',
  borderRadius: '8px',
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
  color: '#10b981',
  margin: '0',
  letterSpacing: '2px',
};

const holdReleasedSection = {
  padding: '16px 30px',
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  margin: '0 30px',
};

const holdReleasedHeading = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1e40af',
  margin: '0 0 8px',
};

const holdReleasedText = {
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
