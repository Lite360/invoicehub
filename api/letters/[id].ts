import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { letters, businesses } from '../../src/db/schema';
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

  const letterId = req.query.id as string;
  if (!letterId) return res.status(400).json({ error: 'Missing letter ID' });

  const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const [letter] = await db.select().from(letters).where(
    and(eq(letters.id, letterId), eq(letters.businessId, business.id))
  );
  if (!letter) return res.status(404).json({ error: 'Letter not found' });

  if (req.method === 'GET') {
    return res.status(200).json(letter);
  }

  if (req.method === 'PUT') {
    const [updated] = await db.update(letters)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(letters.id, letterId))
      .returning();
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    await db.delete(letters).where(eq(letters.id, letterId));
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
