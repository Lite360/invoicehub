import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { payments, businesses } from '../../src/db/schema';
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

  const paymentId = req.query.id as string;
  if (!paymentId) return res.status(400).json({ error: 'Missing payment ID' });

  const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const [payment] = await db.select().from(payments).where(
    and(eq(payments.id, paymentId), eq(payments.businessId, business.id))
  );
  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  if (req.method === 'GET') {
    return res.status(200).json(payment);
  }

  if (req.method === 'DELETE') {
    await db.delete(payments).where(eq(payments.id, paymentId));
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
