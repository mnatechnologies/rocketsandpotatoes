import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link,
} from '@react-email/components';

export type AlertType = 'sanctions_match' | 'smr_created' | 'ttr_deadline' | 'smr_deadline' | 'transaction_flagged';

interface ComplianceAlertEmailProps {
  alertType: AlertType;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  details: {
    label: string;
    value: string;
  }[];
  actionRequired: string;
  deadline?: string;
  adminUrl?: string;
}

const severityColors = {
  critical: { bg: '#fef2f2', border: '#dc2626', text: '#991b1b', icon: '🚨' },
  high: { bg: '#fff7ed', border: '#ea580c', text: '#9a3412', icon: '⚠️' },
  medium: { bg: '#fefce8', border: '#ca8a04', text: '#854d0e', icon: '📋' },
  low: { bg: '#f0f9ff', border: '#0284c7', text: '#075985', icon: 'ℹ️' },
};

export default function ComplianceAlertEmail({
  alertType = 'smr_created',
  title = 'Compliance Alert',
  severity = 'high',
  summary = 'A compliance event requires your attention.',
  details = [],
  actionRequired = 'Please review this matter.',
  deadline,
  adminUrl,
}: ComplianceAlertEmailProps) {
  const colors = severityColors[severity];
  
  return (
    <Html>
      <Head />
      <Preview>{colors.icon} {title} - Australian National Bullion Compliance</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={{ ...header, backgroundColor: colors.bg, borderBottom: `3px solid ${colors.border}` }}>
            <Text style={headerIcon}>{colors.icon}</Text>
            <Heading style={{ ...heading, color: colors.text }}>
              {title}
            </Heading>
            <Text style={{ ...severityBadge, backgroundColor: colors.border }}>
              {severity.toUpperCase()} PRIORITY
            </Text>
          </Section>

          {/* Alert Summary */}
          <Section style={summarySection}>
            <Text style={summaryText}>{summary}</Text>
          </Section>

          <Hr style={hr} />

          {/* Details */}
          <Section style={detailsSection}>
            <Heading style={sectionHeading}>Details</Heading>
            {details.map((detail, index) => (
              <div key={index} style={detailRow}>
                <Text style={detailLabel}>{detail.label}</Text>
                <Text style={detailValue}>{detail.value}</Text>
              </div>
            ))}
          </Section>

          {/* Deadline Warning */}
          {deadline && (
            <>
              <Hr style={hr} />
              <Section style={deadlineSection}>
                <Text style={deadlineIcon}>⏰</Text>
                <Text style={deadlineText}>
                  <strong>Deadline:</strong> {deadline}
                </Text>
                {alertType === 'smr_deadline' && (
                  <Text style={deadlineNote}>
                    SMRs must be submitted to AUSTRAC within 3 business days of forming a suspicion.
                  </Text>
                )}
                {alertType === 'ttr_deadline' && (
                  <Text style={deadlineNote}>
                    TTRs must be submitted to AUSTRAC within 10 business days of the transaction.
                  </Text>
                )}
              </Section>
            </>
          )}

          <Hr style={hr} />

          {/* Action Required */}
          <Section style={actionSection}>
            <Heading style={sectionHeading}>Action Required</Heading>
            <Text style={actionText}>{actionRequired}</Text>
            {adminUrl && (
              <Link href={adminUrl} style={actionButton}>
                Review in Admin Dashboard →
              </Link>
            )}
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              This is an automated compliance alert from Australian National Bullion.
            </Text>
            <Text style={footerText}>
              Alert Type: {alertType} | Generated: {new Date().toISOString()}
            </Text>
            <Text style={footerDisclaimer}>
              This email contains confidential compliance information. 
              Do not forward to unauthorized recipients.
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
  padding: '0',
  marginBottom: '64px',
  maxWidth: '600px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  overflow: 'hidden',
};

const header = {
  padding: '24px 30px',
  textAlign: 'center' as const,
};

const headerIcon = {
  fontSize: '48px',
  margin: '0 0 12px',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const severityBadge = {
  display: 'inline-block',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 'bold',
  padding: '4px 12px',
  borderRadius: '4px',
  margin: '0',
};

const summarySection = {
  padding: '24px 30px',
};

const summaryText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#374151',
  margin: '0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '0',
};

const detailsSection = {
  padding: '24px 30px',
};

const sectionHeading = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 16px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const detailRow = {
  marginBottom: '12px',
};

const detailLabel = {
  fontSize: '12px',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  fontWeight: '600',
  margin: '0 0 4px',
};

const detailValue = {
  fontSize: '15px',
  color: '#1f2937',
  margin: '0',
};

const deadlineSection = {
  padding: '20px 30px',
  backgroundColor: '#fef3c7',
  textAlign: 'center' as const,
};

const deadlineIcon = {
  fontSize: '32px',
  margin: '0 0 8px',
};

const deadlineText = {
  fontSize: '18px',
  color: '#92400e',
  margin: '0 0 8px',
};

const deadlineNote = {
  fontSize: '13px',
  color: '#92400e',
  margin: '0',
};

const actionSection = {
  padding: '24px 30px',
};

const actionText = {
  fontSize: '15px',
  lineHeight: '22px',
  color: '#374151',
  margin: '0 0 16px',
};

const actionButton = {
  display: 'inline-block',
  backgroundColor: '#1f2937',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
};

const footer = {
  padding: '20px 30px',
  backgroundColor: '#f9fafb',
};

const footerText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const footerDisclaimer = {
  fontSize: '11px',
  color: '#9ca3af',
  margin: '12px 0 0',
  textAlign: 'center' as const,
  fontStyle: 'italic' as const,
};









