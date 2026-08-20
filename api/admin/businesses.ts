import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { businesses, subscriptions, plans, users, userRoles } from '../../src/db/schema';
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
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const allBusinesses = await db.select({
    id: businesses.id,
    name: businesses.name,
    type: businesses.type,
    email: businesses.email,
    phone: businesses.phone,
    currency: businesses.currency,
    createdAt: businesses.createdAt,
    ownerEmail: users.email,
    ownerName: users.fullName,
    planId: subscriptions.planId,
    planName: plans.name,
    subscriptionStatus: subscriptions.status,
  })
  .from(businesses)
  .leftJoin(users, eq(users.id, businesses.ownerId))
  .leftJoin(subscriptions, eq(subscriptions.businessId, businesses.id))
  .leftJoin(plans, eq(plans.id, subscriptions.planId))
  .orderBy(desc(businesses.createdAt))
  .limit(limit)
  .offset(offset);

  return res.status(200).json({ businesses: allBusinesses, page, limit });
}
