import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { payments, businesses, userRoles } from '../../src/db/schema';
import { eq, desc } from 'drizzle-orm';
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
  const [role] = await db.select().from(userRoles).where(eq(userRoles.userId, user.id));
  return role ? user : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const admin = await getAdminUser(req);
  if (!admin) return res.status(403).json({ error: 'Forbidden' });

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = (page - 1) * limit;

  const allPayments = await db.select({
    id: payments.id,
    businessId: payments.businessId,
    businessName: businesses.name,
    clientName: payments.clientName,
    amount: payments.amount,
    currency: payments.currency,
    paymentMethod: payments.paymentMethod,
    reference: payments.reference,
    status: payments.status,
    paymentDate: payments.paymentDate,
    notes: payments.notes,
    createdAt: payments.createdAt,
  })
  .from(payments)
  .leftJoin(businesses, eq(businesses.id, payments.businessId))
  .orderBy(desc(payments.createdAt))
  .limit(limit)
  .offset(offset);

  return res.status(200).json({ payments: allPayments, page, limit });
}
