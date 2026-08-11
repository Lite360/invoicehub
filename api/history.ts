import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/db';
import { businesses, invoices, quotations, receipts, letters, payments } from '../src/db/schema';
import { eq, desc } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
  if (!business) return res.status(404).json({ error: 'Business not found' });

  try {
    const allInvoices = await db.select().from(invoices).where(eq(invoices.businessId, business.id)).orderBy(desc(invoices.createdAt));
    const allQuotations = await db.select().from(quotations).where(eq(quotations.businessId, business.id)).orderBy(desc(quotations.createdAt));
    const allReceipts = await db.select().from(receipts).where(eq(receipts.businessId, business.id)).orderBy(desc(receipts.createdAt));
    const allLetters = await db.select().from(letters).where(eq(letters.businessId, business.id)).orderBy(desc(letters.createdAt));
    const allPayments = await db.select().from(payments).where(eq(payments.businessId, business.id)).orderBy(desc(payments.createdAt));

    const history = [
      ...allInvoices.map(i => ({
        id: i.id,
        type: 'invoice',
        title: `Invoice ${i.invoiceNumber}`,
        client: i.clientName,
        status: i.status,
        date: i.createdAt,
        link: `/app/invoices/${i.id}`,
      })),
      ...allQuotations.map(q => ({
        id: q.id,
        type: 'quotation',
        title: `Quotation ${q.quotationNumber}`,
        client: q.clientName,
        status: q.status,
        date: q.createdAt,
        link: `/app/quotations/${q.id}`,
      })),
      ...allReceipts.map(r => ({
        id: r.id,
        type: 'receipt',
        title: `Receipt ${r.receiptNumber}`,
        client: r.clientName,
        status: r.status,
        date: r.createdAt,
        link: `/app/receipts/${r.id}`,
      })),
      ...allLetters.map(l => ({
        id: l.id,
        type: 'letter',
        title: `Letter to ${l.recipientName}`,
        client: l.recipientName,
        status: l.status,
        date: l.createdAt,
        link: `/app/letters/${l.id}`,
      })),
      ...allPayments.map(p => ({
        id: p.id,
        type: 'payment',
        title: `Payment Received: ${p.currency} ${p.amount}`,
        client: p.clientName,
        status: p.status,
        date: p.createdAt,
        link: `/app/payments`,
      })),
    ];

    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.status(200).json(history);
  } catch (error: any) {
    console.error('History API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
