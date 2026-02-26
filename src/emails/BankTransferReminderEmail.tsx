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
  Row,
  Column,
  Img
} from '@react-email/components';

interface BankTransferReminderEmailProps {
  customerName: string;
  referenceCode: string;
  amountAud: number;
  bankName: string;
  bsb: string;
  accountNumber: string;
  accountName: string;
  payidIdentifier?: string;
  payidType?: string;
  paymentDeadline: string;
  hoursRemaining: number;
}

function formatAud(amount: number): string {
  return `A$${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BankTransferReminderEmail({
  customerName = 'John Doe',
  referenceCode = 'BT-ABC123',
  amountAud = 0,
  bankName = 'Commonwealth Bank',
  bsb = '000-000',
  accountNumber = '12345678',
  accountName = 'Australian National Bullion',
  payidIdentifier,
  payidType,
  paymentDeadline = new Date().toISOString(),
  hoursRemaining = 6,
}: BankTransferReminderEmailProps) {
  const deadlineDate = new Date(paymentDeadline);
  const formattedDeadline = deadlineDate.toLocaleString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Australia/Sydney',
    timeZoneName: 'short',
  });

  return (
    <Html>
      <Head />
      <Preview>Payment Reminder - {String(hoursRemaining)} hours remaining - {referenceCode}</Preview>
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

          {/* Urgent Warning */}
          <Section style={urgentSection}>
            <Text style={urgentIcon}>!</Text>
            <Heading style={urgentHeading}>Payment Reminder</Heading>
            <Text style={urgentText}>
              Hi {customerName}, your bank transfer payment is due in approximately {hoursRemaining} hours. Please complete your transfer to avoid order cancellation.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Deadline */}
          <Section style={deadlineSection}>
            <Text style={deadlineLabel}>PAYMENT DEADLINE</Text>
            <Text style={deadlineValue}>{formattedDeadline}</Text>
          </Section>

          <Hr style={hr} />

          {/* Reference Code */}
          <Section style={referenceSection}>
            <Text style={referenceLabel}>YOUR PAYMENT REFERENCE</Text>
            <Text style={referenceValue}>{referenceCode}</Text>
          </Section>

          <Hr style={hr} />

          {/* Amount */}
          <Section style={amountSection}>
            <Row style={amountRow}>
              <Column style={amountLabelCol}>
                <Text style={amountLabel}>Amount Due</Text>
              </Column>
              <Column style={amountValueCol}>
                <Text style={amountValue}>{formatAud(amountAud)}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {/* Bank Details */}
          <Section style={bankDetailsSection}>
            <Heading style={sectionHeading}>Bank Transfer Details</Heading>
            <Row style={bankDetailRow}>
              <Column style={bankDetailLabelCol}>
                <Text style={bankDetailLabel}>Bank Name</Text>
              </Column>
              <Column style={bankDetailValueCol}>
                <Text style={bankDetailValue}>{bankName}</Text>
              </Column>
            </Row>
            <Row style={bankDetailRow}>
              <Column style={bankDetailLabelCol}>
                <Text style={bankDetailLabel}>BSB</Text>
              </Column>
              <Column style={bankDetailValueCol}>
                <Text style={bankDetailValue}>{bsb}</Text>
              </Column>
            </Row>
            <Row style={bankDetailRow}>
              <Column style={bankDetailLabelCol}>
                <Text style={bankDetailLabel}>Account Number</Text>
              </Column>
              <Column style={bankDetailValueCol}>
                <Text style={bankDetailValue}>{accountNumber}</Text>
              </Column>
            </Row>
            <Row style={bankDetailRow}>
              <Column style={bankDetailLabelCol}>
                <Text style={bankDetailLabel}>Account Name</Text>
              </Column>
              <Column style={bankDetailValueCol}>
                <Text style={bankDetailValue}>{accountName}</Text>
              </Column>
            </Row>
            <Row style={bankDetailRow}>
              <Column style={bankDetailLabelCol}>
                <Text style={bankDetailLabel}>Reference</Text>
              </Column>
              <Column style={bankDetailValueCol}>
                <Text style={bankDetailValueBold}>{referenceCode}</Text>
              </Column>
            </Row>
            <Row style={bankDetailRow}>
              <Column style={bankDetailLabelCol}>
                <Text style={bankDetailLabel}>Amount</Text>
              </Column>
              <Column style={bankDetailValueCol}>
                <Text style={bankDetailValueBold}>{formatAud(amountAud)}</Text>
              </Column>
            </Row>

            {payidIdentifier && payidType && (
              <>
                <Hr style={hr} />
                <Text style={payidHeading}>PayID (Alternative)</Text>
                <Row style={bankDetailRow}>
                  <Column style={bankDetailLabelCol}>
                    <Text style={bankDetailLabel}>PayID Type</Text>
                  </Column>
                  <Column style={bankDetailValueCol}>
                    <Text style={bankDetailValue}>{payidType}</Text>
                  </Column>
                </Row>
                <Row style={bankDetailRow}>
                  <Column style={bankDetailLabelCol}>
                    <Text style={bankDetailLabel}>PayID</Text>
                  </Column>
                  <Column style={bankDetailValueCol}>
                    <Text style={bankDetailValue}>{payidIdentifier}</Text>
                  </Column>
                </Row>
              </>
            )}
          </Section>

          <Hr style={hr} />

          {/* What happens if not paid */}
          <Section style={warningSection}>
            <Text style={warningHeading}>What happens if payment is not received?</Text>
            <Text style={warningText}>
              If your bank transfer is not received by the deadline, your order will be automatically cancelled. If the market price has dropped, the card hold may be partially captured to cover market losses as per our terms and conditions.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Already made your transfer? Please allow 1-2 business days for processing. If you believe your payment has been received, please{' '}
              <Link href="mailto:info@australiannationalbullion.com.au" style={link}>
                contact us
              </Link>.
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

const urgentSection = {
  textAlign: 'center' as const,
  padding: '0 30px',
};

const urgentIcon = {
  fontSize: '48px',
  lineHeight: '64px',
  margin: '16px 0',
  color: '#f59e0b',
  fontWeight: 'bold',
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: '#fff3e0',
  display: 'inline-block' as const,
};

const urgentHeading = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#92400e',
  margin: '0 0 16px',
};

const urgentText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#92400e',
  margin: '0 0 16px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const deadlineSection = {
  textAlign: 'center' as const,
  padding: '20px 30px',
  backgroundColor: '#fff3e0',
  borderRadius: '8px',
  margin: '0 30px',
};

const deadlineLabel = {
  fontSize: '12px',
  color: '#92400e',
  textTransform: 'uppercase' as const,
  fontWeight: '600',
  margin: '0 0 8px',
  letterSpacing: '1px',
};

const deadlineValue = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#92400e',
  margin: '0',
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

const amountSection = {
  padding: '0 30px',
};

const amountRow = {
  padding: '8px 0',
};

const amountLabelCol = {
  width: '50%',
};

const amountValueCol = {
  width: '50%',
  textAlign: 'right' as const,
};

const amountLabel = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0',
};

const amountValue = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0',
};

const bankDetailsSection = {
  padding: '0 30px',
};

const sectionHeading = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 16px',
};

const bankDetailRow = {
  padding: '6px 0',
};

const bankDetailLabelCol = {
  width: '40%',
};

const bankDetailValueCol = {
  width: '60%',
};

const bankDetailLabel = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
};

const bankDetailValue = {
  fontSize: '14px',
  color: '#1f2937',
  fontWeight: '500',
  margin: '0',
};

const bankDetailValueBold = {
  fontSize: '14px',
  color: '#1f2937',
  fontWeight: 'bold',
  margin: '0',
};

const payidHeading = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 12px',
};

const warningSection = {
  padding: '16px 30px',
  backgroundColor: '#ffebee',
  borderRadius: '8px',
  margin: '0 30px',
};

const warningHeading = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#b91c1c',
  margin: '0 0 8px',
};

const warningText = {
  fontSize: '14px',
  color: '#b91c1c',
  lineHeight: '20px',
  margin: '0',
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
