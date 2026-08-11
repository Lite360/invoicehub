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

interface ReceiptEmailProps {
  receipt: any;
  business: any;
  dashboardLink: string;
}

export const ReceiptEmail = ({ receipt, business, dashboardLink }: ReceiptEmailProps) => {
  const formattedTotal = `${receipt?.currency || 'USD'} ${Number(receipt?.total || 0).toLocaleString()}`;
  
  return (
    <Html>
      <Head />
      <Preview>Payment Receipt from {business?.name || 'InvoiceHub'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={businessName}>{business?.name || 'Your Business'}</Text>
          </Section>
          <Section style={content}>
            <Text style={greeting}>Hi {receipt?.clientName || 'Customer'},</Text>
            <Text style={paragraph}>
              Thank you for your payment. This email serves as your official receipt <strong>({receipt?.receiptNumber})</strong>.
            </Text>
            <Section style={receiptDetailsBox}>
              <Text style={amountText}>Amount Paid</Text>
              <Text style={totalAmount}>{formattedTotal}</Text>
              
              <div style={{ marginTop: '20px', textAlign: 'left', padding: '0 20px' }}>
                <Text style={detailRow}>
                  <strong>Date:</strong> {new Date(receipt?.issueDate || Date.now()).toLocaleDateString()}
                </Text>
                {receipt?.paymentMethod && (
                  <Text style={detailRow}>
                    <strong>Method:</strong> <span style={{ textTransform: 'capitalize' }}>{receipt.paymentMethod}</span>
                  </Text>
                )}
                {receipt?.invoiceId && (
                  <Text style={detailRow}>
                    <strong>For Invoice:</strong> {receipt.invoiceId}
                  </Text>
                )}
              </div>
            </Section>
            
            <Section style={buttonContainer}>
              <Button style={button} href={dashboardLink}>
                Log in to View Dashboard
              </Button>
            </Section>
            
            <Text style={paragraph}>
              If you have any questions, please reply directly to this email or contact us at {business?.email}.
            </Text>
            <Text style={signoff}>
              Best regards, <br />
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

export default ReceiptEmail;

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

const receiptDetailsBox = {
  backgroundColor: '#f0fdf4', // Light green bg for success
  borderRadius: '8px',
  padding: '24px',
  marginTop: '24px',
  marginBottom: '24px',
  textAlign: 'center' as const,
  border: '1px solid #bbf7d0',
};

const amountText = {
  fontSize: '14px',
  color: '#166534',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 8px 0',
  fontWeight: 'bold',
};

const totalAmount = {
  fontSize: '36px',
  fontWeight: 'bold',
  color: '#14532d',
  margin: '0',
};

const detailRow = {
  fontSize: '14px',
  color: '#374151',
  margin: '8px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
};

const button = {
  backgroundColor: '#16a34a',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 24px',
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
