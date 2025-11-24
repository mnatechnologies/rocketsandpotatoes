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


interface OrderConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    weight?: string;
    purity?: string;
  }>;
  subtotal: number;
  total: number;
  currency: string;
  paymentMethod: string;
  requiresKYC?: boolean;
  requiresTTR?: boolean;
}

export default function OrderConfirmationEmail({
 orderNumber = 'ORD-123456',
 customerName = 'John Doe',
 customerEmail = 'customer@example.com',
 orderDate = new Date().toLocaleDateString('en-AU', {
   year: 'numeric',
   month: 'long',
   day: 'numeric'
 }),
 items = [],
 subtotal = 0,
 total = 0,
 currency = 'AUD',
 paymentMethod = 'Card',
 requiresKYC = false,
 requiresTTR = false,
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Order Confirmation - Australian National Bullion</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src='https://vlvejjyyvzrepccgmsvo.supabase.co/storage/v1/object/public/Images/anblogo.png'
              width="150"
              height="50"
              alt="Australian National Bullion"
              style={logo}
            />
          </Section>

          {/* Success Message */}
          <Section style={successSection}>
            <Text style={successIcon}>✓</Text>
            <Heading style={heading}>Order Confirmed!</Heading>
            <Text style={paragraph}>
              Thank you for your purchase, {customerName}. Your order has been received and is being processed.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Order Details */}
          <Section style={orderInfoSection}>
            <Row>
              <Column style={orderInfoColumn}>
                <Text style={orderInfoLabel}>Order Number</Text>
                <Text style={orderInfoValue}>{orderNumber}</Text>
              </Column>
              <Column style={orderInfoColumn}>
                <Text style={orderInfoLabel}>Order Date</Text>
                <Text style={orderInfoValue}>{orderDate}</Text>
              </Column>
            </Row>
            <Row>
              <Column style={orderInfoColumn}>
                <Text style={orderInfoLabel}>Payment Method</Text>
                <Text style={orderInfoValue}>{paymentMethod}</Text>
              </Column>
              <Column style={orderInfoColumn}>
                <Text style={orderInfoLabel}>Email</Text>
                <Text style={orderInfoValue}>{customerEmail}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {/* Order Items */}
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
                    <Text style={itemPrice}>
                      ${item.price.toFixed(2)} {currency}
                    </Text>
                  </Column>
                </Row>
              </div>
            ))}

            <Hr style={hr} />

            {/* Totals */}
            <Row style={totalRow}>
              <Column style={totalLabelColumn}>
                <Text style={totalLabel}>Subtotal</Text>
              </Column>
              <Column style={totalValueColumn}>
                <Text style={totalValue}>
                  ${subtotal.toFixed(2)} {currency}
                </Text>
              </Column>
            </Row>
            <Row style={totalRow}>
              <Column style={totalLabelColumn}>
                <Text style={totalLabelBold}>Total</Text>
              </Column>
              <Column style={totalValueColumn}>
                <Text style={totalValueBold}>
                  ${total.toFixed(2)} {currency}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Compliance Notice */}
          {(requiresKYC || requiresTTR) && (
            <>
              <Hr style={hr} />
              <Section style={complianceSection}>
                <Text style={complianceHeading}>⚠️ Compliance Requirements</Text>
                <Text style={complianceParagraph}>
                  Due to the value of your order, additional verification is required under Australian AML/CTF regulations:
                </Text>
                <ul style={complianceList}>
                  {requiresKYC && (
                    <li style={complianceItem}>
                      <strong>Identity Verification (KYC)</strong> - Please provide government-issued ID
                    </li>
                  )}
                  {requiresTTR && (
                    <li style={complianceItem}>
                      <strong>Transaction Reporting (TTR)</strong> - This transaction will be reported to AUSTRAC as required by law
                    </li>
                  )}
                </ul>
                <Text style={complianceParagraph}>
                  Our team will contact you within 1-2 business days to complete the verification process.
                </Text>
              </Section>
            </>
          )}

          <Hr style={hr} />

          {/* Next Steps */}
          <Section style={nextStepsSection}>
            <Heading style={sectionHeading}>What Happens Next?</Heading>
            <ul style={nextStepsList}>
              <li style={nextStepsItem}>
                <strong>1. Order Processing:</strong> We&#39;ll prepare your order for shipment
              </li>
              <li style={nextStepsItem}>
                <strong>2. Shipping:</strong> You&#39;ll receive tracking information via email
              </li>
              <li style={nextStepsItem}>
                <strong>3. Delivery:</strong> Signature required upon delivery (fully insured)
              </li>
            </ul>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Questions about your order?{' '}
              <Link href="mailto:support@australiannationalbullion.com.au" style={link}>
                Contact Support
              </Link>
            </Text>
            <Text style={footerText}>
              <Link href={`https://your-domain.com/order-confirmation?orderId=${orderNumber}`} style={link}>
                View Order Details
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

const orderInfoSection = {
  padding: '0 30px',
};

const orderInfoColumn = {
  padding: '8px 0',
};

const orderInfoLabel = {
  fontSize: '12px',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  fontWeight: '600',
  margin: '0 0 4px',
};

const orderInfoValue = {
  fontSize: '16px',
  color: '#1f2937',
  fontWeight: '500',
  margin: '0',
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

const totalLabel = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
};

const totalLabelBold = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0',
};

const totalValue = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
};

const totalValueBold = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0',
};

const complianceSection = {
  padding: '0 30px',
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  margin: '16px 30px',
};

const complianceHeading = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#92400e',
  margin: '16px 0 8px',
};

const complianceParagraph = {
  fontSize: '14px',
  color: '#92400e',
  lineHeight: '20px',
  margin: '8px 0',
};

const complianceList = {
  margin: '12px 0',
  paddingLeft: '20px',
};

const complianceItem = {
  fontSize: '14px',
  color: '#92400e',
  lineHeight: '22px',
  margin: '8px 0',
};

const nextStepsSection = {
  padding: '0 30px',
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