import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/db';
import { businesses, invoices, customers, receipts, quotations } from '../src/db/schema';
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

  // 1. Fetch Invoices
  const allInvoices = await db.select().from(invoices).where(eq(invoices.businessId, business.id)).orderBy(desc(invoices.createdAt));
  
  // 2. Fetch Customers
  const allCustomers = await db.select().from(customers).where(eq(customers.businessId, business.id));

  // 3. Fetch Receipts (for payments context if needed)
  const allReceipts = await db.select().from(receipts).where(eq(receipts.businessId, business.id)).orderBy(desc(receipts.createdAt));

  // 4. Fetch Quotations
  const allQuotations = await db.select().from(quotations).where(eq(quotations.businessId, business.id)).orderBy(desc(quotations.createdAt));

  // Calculate Stats
  const totalInvoices = allInvoices.length;
  
  const paidInvoices = allInvoices.filter(i => i.status === 'paid');
  const paidCount = paidInvoices.length;
  
  const pendingPayments = allInvoices
    .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((sum, inv) => sum + Number(inv.balanceDue || 0), 0);

  const totalCustomers = allCustomers.length;

  // Build Recent Activity Feed (top 5 most recent across entities)
  const activity = [
    ...allInvoices.map(i => ({
      id: i.id,
      type: 'invoice',
      title: `Invoice ${i.invoiceNumber}`,
      subtitle: `For ${i.clientName} - ${i.currency} ${Number(i.total).toLocaleString()}`,
      date: i.createdAt,
      link: `/app/invoices/${i.id}`,
      icon: '🧾',
    })),
    ...allQuotations.map(q => ({
      id: q.id,
      type: 'quotation',
      title: `Quotation ${q.quotationNumber}`,
      subtitle: `For ${q.clientName} - ${q.currency} ${Number(q.total).toLocaleString()}`,
      date: q.createdAt,
      link: `/app/quotations/${q.id}`,
      icon: '📋',
    })),
    ...allReceipts.map(r => ({
      id: r.id,
      type: 'receipt',
      title: `Receipt ${r.receiptNumber}`,
      subtitle: `From ${r.clientName} - ${r.currency} ${Number(r.total).toLocaleString()}`,
      date: r.createdAt,
      link: `/app/receipts/${r.id}`,
      icon: '💵',
    }))
  ];

  // Sort descending by date and take top 5
  activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentActivity = activity.slice(0, 5);

  return res.status(200).json({
    stats: {
      totalInvoices,
      paidCount,
      pendingPayments,
      totalCustomers,
      currency: business.currency || 'NGN',
    },
    recentActivity,
  });
}
