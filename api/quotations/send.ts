import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { quotations, businesses } from '../../src/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';
import { getResendClient } from '../utils/emailClient';
import { render } from '@react-email/components';
import { QuotationEmail } from '../../src/emails/QuotationEmail';

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

  const { quotationId } = req.body;
  if (!quotationId) return res.status(400).json({ error: 'Missing quotationId' });

  try {
    const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
    if (!business) return res.status(404).json({ error: 'Business not found' });

    const [quotation] = await db.select().from(quotations).where(
      and(eq(quotations.id, quotationId), eq(quotations.businessId, business.id))
    );
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
    if (!quotation.clientEmail) return res.status(400).json({ error: 'Customer has no email address' });

    const resend = await getResendClient(user.id);

    await resend.emails.send({
      from: 'InvoiceHub <billing@invoicehub.com>',
      to: [quotation.clientEmail],
      subject: `Quotation ${quotation.quotationNumber} from ${business.name}`,
      html: await render(QuotationEmail({ quotation, business })),
    });

    if (quotation.status === 'draft') {
      await db.update(quotations).set({ status: 'sent', updatedAt: new Date() }).where(eq(quotations.id, quotationId));
    }

    return res.status(200).json({ success: true, message: 'Quotation sent successfully' });
  } catch (error: any) {
    console.error('Failed to send quotation email:', error);
    return res.status(500).json({ error: error.message });
  }
}
