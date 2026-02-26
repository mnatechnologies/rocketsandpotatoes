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

interface BankTransferInvoiceEmailProps {
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
  depositAmountAud: number;
  cardLastFour?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    weight?: string;
    purity?: string;
  }>;
}

function formatAud(amount: number): string {
  return `A$${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BankTransferInvoiceEmail({
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
  depositAmountAud = 0,
  cardLastFour,
  items = [],
}: BankTransferInvoiceEmailProps) {
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
      <Preview>Bank Transfer Invoice - {referenceCode} - Australian National Bullion</Preview>
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

          {/* Title */}
          <Section style={titleSection}>
            <Heading style={heading}>Bank Transfer Invoice</Heading>
            <Text style={paragraph}>
              Hi {customerName}, thank you for your order. Please complete your bank transfer using the details below.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Reference Code - Prominent */}
          <Section style={referenceSection}>
            <Text style={referenceLabel}>YOUR PAYMENT REFERENCE</Text>
            <Text style={referenceValue}>{referenceCode}</Text>
            <Text style={referenceNote}>
              You MUST include this reference in your bank transfer description
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Order Summary */}
          <Section style={itemsSection}>
            <Heading style={sectionHeading}>Order Summary</Heading>
            {items.map((item, index) => (
              <div key={index} style={itemRow}>
                <Row>
                  <Column style={itemNameColumn}>
                    <Text style={itemName}>{item.name}</Text>
                    {item.weight && (
                      <Text style={itemDetails}>Weight: {item.weight}</Text>
                    )}
                    {item.purity && (
                      <Text style={itemDetails}>Purity: {item.purity}</Text>
                    )}
                  </Column>
                  <Column style={itemQtyColumn}>
                    <Text style={itemQty}>Qty: {item.quantity}</Text>
                  </Column>
                  <Column style={itemPriceColumn}>
                    <Text style={itemPrice}>{formatAud(item.price)}</Text>
                  </Column>
                </Row>
              </div>
            ))}

            <Hr style={hr} />

            <Row style={totalRow}>
              <Column style={totalLabelColumn}>
                <Text style={totalLabelBold}>Amount Due</Text>
              </Column>
              <Column style={totalValueColumn}>
                <Text style={totalValueBold}>{formatAud(amountAud)}</Text>
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

          {/* Payment Deadline */}
          <Section style={deadlineSection}>
            <Text style={deadlineLabel}>PAYMENT DEADLINE</Text>
            <Text style={deadlineValue}>{formattedDeadline}</Text>
            <Text style={deadlineNote}>
              Your transfer must be received before this time or your order will be cancelled.
            </Text>
          </Section>

          {/* Hold Disclosure */}
          {cardLastFour && depositAmountAud > 0 && (
            <>
              <Hr style={hr} />
              <Section style={holdSection}>
                <Text style={holdHeading}>Card Hold Notice</Text>
                <Text style={holdText}>
                  A hold of {formatAud(depositAmountAud)} has been placed on your card ending {cardLastFour}. This is NOT a charge. The hold will be automatically released once your bank transfer is confirmed.
                </Text>
              </Section>
            </>
          )}

          <Hr style={hr} />

          {/* Transfer Instructions */}
          <Section style={instructionsSection}>
            <Heading style={sectionHeading}>Important Instructions</Heading>
            <ul style={instructionsList}>
              <li style={instructionsItem}>
                <strong>Use the exact reference code:</strong> {referenceCode} — transfers without the correct reference may not be matched to your order
              </li>
              <li style={instructionsItem}>
                <strong>Transfer must come from a bank account in YOUR name</strong> — third-party payments cannot be accepted under AML/CTF regulations
              </li>
              <li style={instructionsItem}>
                <strong>Transfer the exact amount:</strong> {formatAud(amountAud)}
              </li>
              <li style={instructionsItem}>
                <strong>Allow processing time:</strong> Bank transfers typically take 1-2 business days to clear
              </li>
            </ul>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Questions about your transfer?{' '}
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

const titleSection = {
  textAlign: 'center' as const,
  padding: '0 30px',
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
  margin: '0 0 8px',
  letterSpacing: '2px',
};

const referenceNote = {
  fontSize: '13px',
  color: '#4b5563',
  margin: '0',
  fontStyle: 'italic' as const,
};

const itemsSection = {
  padding: '0 30px',
};

const sectionHeading = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 16px',
};

const itemRow = {
  padding: '12px 0',
  borderBottom: '1px solid #f3f4f6',
};

const itemNameColumn = {
  width: '60%',
};

const itemQtyColumn = {
  width: '20%',
  textAlign: 'center' as const,
};

const itemPriceColumn = {
  width: '20%',
  textAlign: 'right' as const,
};

const itemName = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 4px',
};

const itemDetails = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '2px 0',
};

const itemQty = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
};

const itemPrice = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0',
};

const totalRow = {
  padding: '8px 0',
};

const totalLabelColumn = {
  width: '70%',
  textAlign: 'right' as const,
  paddingRight: '20px',
};

const totalValueColumn = {
  width: '30%',
  textAlign: 'right' as const,
};

const totalLabelBold = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0',
};

const totalValueBold = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0',
};

const bankDetailsSection = {
  padding: '0 30px',
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
  margin: '0 0 8px',
};

const deadlineNote = {
  fontSize: '13px',
  color: '#92400e',
  margin: '0',
};

const holdSection = {
  padding: '16px 30px',
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  margin: '0 30px',
};

const holdHeading = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1e40af',
  margin: '0 0 8px',
};

const holdText = {
  fontSize: '14px',
  color: '#1e40af',
  lineHeight: '20px',
  margin: '0',
};

const instructionsSection = {
  padding: '0 30px',
};

const instructionsList = {
  margin: '12px 0',
  paddingLeft: '20px',
};

const instructionsItem = {
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
