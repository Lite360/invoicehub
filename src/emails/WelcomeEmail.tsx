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

interface WelcomeEmailProps {
  userName: string;
}

export const WelcomeEmail = ({ userName }: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to InvoiceHub!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={businessName}>InvoiceHub</Text>
          </Section>
          <Section style={content}>
            <Text style={greeting}>Welcome {userName || 'aboard'},</Text>
            <Text style={paragraph}>
              We're thrilled to have you! InvoiceHub is designed to help you create professional invoices, manage your customers, and get paid faster.
            </Text>
            <Text style={paragraph}>
              To get started, please complete your business setup and customize your branding. This ensures your documents look exactly the way you want them to.
            </Text>
            
            <Section style={buttonContainer}>
              <Button style={button} href={`${process.env.VITE_APP_URL || 'https://invoicehub.com'}/app/dashboard`}>
                Go to Dashboard
              </Button>
            </Section>
            
            <Text style={paragraph}>
              If you have any questions or need help setting things up, our support team is always here for you.
            </Text>
            <Text style={signoff}>
              Happy invoicing! <br />
              <strong>The InvoiceHub Team</strong>
            </Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            InvoiceHub — Professional billing for modern businesses.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

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
  color: '#4f46e5',
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

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
};

const button = {
  backgroundColor: '#4f46e5',
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
