import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { invoices, businesses } from '../../src/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';
import { getResendClient } from '../utils/emailClient';
import { render } from '@react-email/components';
import { InvoiceEmail } from '../../src/emails/InvoiceEmail';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function getUser(req: VercelRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { invoiceId } = req.body;
  if (!invoiceId) return res.status(400).json({ error: 'Missing invoiceId' });

  try {
    const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
    if (!business) return res.status(404).json({ error: 'Business not found' });

    const [invoice] = await db.select().from(invoices).where(
      and(eq(invoices.id, invoiceId), eq(invoices.businessId, business.id))
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (!invoice.clientEmail) return res.status(400).json({ error: 'Customer has no email address' });

    // Build the public payment link based on the request origin (or fallback to production URL)
    const host = req.headers.origin || `https://${req.headers.host}`;
    const paymentLink = `${host}/pay/${invoice.id}`;

    // Get the dynamically authenticated Resend client
    const resend = await getResendClient(user.id);

    // Send the email
    await resend.emails.send({
      from: 'InvoiceHub <billing@invoicehub.com>', // Note: in production, you must verify your own domain
      to: [invoice.clientEmail],
      subject: `Invoice ${invoice.invoiceNumber} from ${business.name}`,
      html: await render(InvoiceEmail({ invoice, business, paymentLink })),
    });

    // Update the invoice status to "sent" if it's currently a draft
    if (invoice.status === 'draft') {
      await db.update(invoices).set({ status: 'sent', updatedAt: new Date() }).where(eq(invoices.id, invoiceId));
    }

    return res.status(200).json({ success: true, message: 'Invoice sent successfully' });
  } catch (error: any) {
    console.error('Failed to send invoice email:', error);
    return res.status(500).json({ error: error.message });
  }
}
