import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { users, businesses, subscriptions, payments, invoices, quotations, receipts, letters, userRoles } from '../../src/db/schema';
import { eq, count, sum, and } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function getAdminUser(req: VercelRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;
  // Check if user has an admin role
  const [role] = await db.select().from(userRoles).where(eq(userRoles.userId, user.id));
  if (!role) return null;
  return user;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await getAdminUser(req);
  if (!admin) return res.status(403).json({ error: 'Forbidden: Admin access required' });

  try {
    const [
      [{ value: totalUsers }],
      [{ value: totalBusinesses }],
      allSubscriptions,
      allPayments,
      [{ value: totalInvoices }],
      [{ value: totalQuotations }],
      [{ value: totalReceipts }],
      [{ value: totalLetters }],
    ] = await Promise.all([
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(businesses),
      db.select().from(subscriptions),
      db.select().from(payments),
      db.select({ value: count() }).from(invoices),
      db.select({ value: count() }).from(quotations),
      db.select({ value: count() }).from(receipts),
      db.select({ value: count() }).from(letters),
    ]);

    const activeSubscriptions = allSubscriptions.filter(s => s.status === 'active').length;
    const trialSubscriptions = allSubscriptions.filter(s => s.status === 'trial').length;
    const successfulPayments = allPayments.filter(p => p.status === 'completed');
    const failedPayments = allPayments.filter(p => p.status === 'failed').length;
    const totalRevenue = successfulPayments.reduce((s, p) => s + Number(p.amount), 0);

    // Monthly recurring revenue (active subscriptions * ... approximation from payments this month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyPayments = successfulPayments.filter(p => new Date(p.createdAt) >= startOfMonth);
    const mrr = monthlyPayments.reduce((s, p) => s + Number(p.amount), 0);

    return res.status(200).json({
      totalUsers,
      totalBusinesses,
      activeSubscriptions,
      trialUsers: trialSubscriptions,
      monthlyRevenue: mrr,
      totalRevenue,
      totalDocuments: Number(totalInvoices) + Number(totalQuotations) + Number(totalReceipts) + Number(totalLetters),
      totalInvoices,
      totalQuotations,
      totalReceipts,
      successfulPayments: successfulPayments.length,
      failedPayments,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
