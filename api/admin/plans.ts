import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { plans, userRoles } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
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
  const admin = await getAdminUser(req);
  if (!admin) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    const allPlans = await db.select().from(plans);
    return res.status(200).json(allPlans);
  }

  if (req.method === 'POST') {
    const { id, name, description, weeklyPrice, monthlyPrice, yearlyPrice, invoiceLimit, customerLimit, teamMemberLimit, features, status } = req.body;
    const [plan] = await db.insert(plans).values({
      id: id || name.toLowerCase().replace(/\s+/g, '_'),
      name,
      description,
      weeklyPrice: String(weeklyPrice || 0),
      monthlyPrice: String(monthlyPrice || 0),
      yearlyPrice: String(yearlyPrice || 0),
      invoiceLimit,
      customerLimit,
      teamMemberLimit: teamMemberLimit || 1,
      features: JSON.stringify(features || []),
      status: status || 'active',
    }).returning();
    return res.status(201).json(plan);
  }

  if (req.method === 'PUT') {
    const planId = req.query.id as string;
    if (!planId) return res.status(400).json({ error: 'Plan ID required' });
    const { name, description, weeklyPrice, monthlyPrice, yearlyPrice, invoiceLimit, customerLimit, teamMemberLimit, features, status } = req.body;
    const [updated] = await db.update(plans).set({
      name,
      description,
      weeklyPrice: String(weeklyPrice || 0),
      monthlyPrice: String(monthlyPrice || 0),
      yearlyPrice: String(yearlyPrice || 0),
      invoiceLimit,
      customerLimit,
      teamMemberLimit: teamMemberLimit || 1,
      features: JSON.stringify(features || []),
      status,
      updatedAt: new Date(),
    }).where(eq(plans.id, planId)).returning();
    return res.status(200).json(updated);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
