import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { businesses, subscriptions, plans, payments } from '../../src/db/schema';
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
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
  if (!business) return res.status(404).json({ error: 'Business not found' });

  if (req.method === 'GET') {
    const [subscription] = await db.select({
      id: subscriptions.id,
      planId: subscriptions.planId,
      status: subscriptions.status,
      billingCycle: subscriptions.billingCycle,
      currentPeriodStart: subscriptions.currentPeriodStart,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      planName: plans.name,
      planDescription: plans.description,
      weeklyPrice: plans.weeklyPrice,
      monthlyPrice: plans.monthlyPrice,
      yearlyPrice: plans.yearlyPrice,
      invoiceLimit: plans.invoiceLimit,
      customerLimit: plans.customerLimit,
      features: plans.features,
    })
    .from(subscriptions)
    .leftJoin(plans, eq(plans.id, subscriptions.planId))
    .where(eq(subscriptions.businessId, business.id));

    const allPlans = await db.select().from(plans).where(eq(plans.status, 'active'));

    const recentPayments = await db.select().from(payments)
      .where(eq(payments.businessId, business.id))
      .orderBy(desc(payments.createdAt))
      .limit(10);

    return res.status(200).json({ subscription, plans: allPlans, recentPayments, currency: business.currency });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
