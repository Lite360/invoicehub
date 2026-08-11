import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { customers, businesses } from '../../src/db/schema';
import { eq, and } from 'drizzle-orm';
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

  const customerId = req.query.id as string;
  if (!customerId) return res.status(400).json({ error: 'Missing customer ID' });

  const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const [customer] = await db.select().from(customers).where(
    and(eq(customers.id, customerId), eq(customers.businessId, business.id))
  );
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  if (req.method === 'GET') {
    return res.status(200).json(customer);
  }

  if (req.method === 'PUT') {
    const [updated] = await db.update(customers)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(customers.id, customerId))
      .returning();
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    await db.delete(customers).where(eq(customers.id, customerId));
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
