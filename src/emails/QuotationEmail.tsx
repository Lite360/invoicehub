import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface QuotationEmailProps {
  quotation: any;
  business: any;
}

export const QuotationEmail = ({ quotation, business }: QuotationEmailProps) => {
  const formattedTotal = `${quotation?.currency || 'USD'} ${Number(quotation?.total || 0).toLocaleString()}`;
  
  return (
    <Html>
      <Head />
      <Preview>New quotation from {business?.name || 'InvoiceHub'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={businessName}>{business?.name || 'Your Business'}</Text>
          </Section>
          <Section style={content}>
            <Text style={greeting}>Hi {quotation?.clientName || 'Customer'},</Text>
            <Text style={paragraph}>
              You have received a new quotation <strong>({quotation?.quotationNumber})</strong> from {business?.name}.
            </Text>
            <Section style={invoiceDetailsBox}>
              <Text style={amountText}>Total Amount</Text>
              <Text style={totalAmount}>{formattedTotal}</Text>
              {quotation?.validUntil && (
                <Text style={dueDateText}>Valid until: {new Date(quotation.validUntil).toLocaleDateString()}</Text>
              )}
            </Section>
            
            <Text style={paragraph}>
              If you have any questions or wish to proceed with this quotation, please reply directly to this email or contact us at {business?.email}.
            </Text>
            <Text style={signoff}>
              Thank you for considering us! <br />
              <strong>{business?.name}</strong>
            </Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Sent via InvoiceHub — Professional billing for modern businesses.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default QuotationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '12px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
  maxWidth: '600px',
};

const header = {
  padding: '32px 48px',
  borderBottom: '1px solid #e6ebf1',
};

const businessName = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#333',
  margin: '0',
};

const content = {
  padding: '32px 48px',
};

const greeting = {
  fontSize: '18px',
  lineHeight: '26px',
  color: '#333',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#525f7f',
};

const invoiceDetailsBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '24px',
  marginTop: '24px',
  marginBottom: '24px',
  textAlign: 'center' as const,
};

const amountText = {
  fontSize: '14px',
  color: '#64748b',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 8px 0',
};

const totalAmount = {
  fontSize: '36px',
  fontWeight: 'bold',
  color: '#0f172a',
  margin: '0',
};

const dueDateText = {
  fontSize: '14px',
  color: '#64748b',
  marginTop: '12px',
  fontWeight: '500',
};

const signoff = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#525f7f',
  marginTop: '32px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  padding: '0 48px',
};
