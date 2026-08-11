import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { customers, businesses } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
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
    const rows = await db
      .select()
      .from(customers)
      .where(eq(customers.businessId, business.id))
      .orderBy(customers.createdAt);
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const [newCustomer] = await db.insert(customers).values({
      ...req.body,
      businessId: business.id,
    }).returning();
    return res.status(201).json(newCustomer);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
