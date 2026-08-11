import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { receipts, receiptItems, businesses } from '../../src/db/schema';
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

  const receiptId = req.query.id as string;
  if (!receiptId) return res.status(400).json({ error: 'Missing receipt ID' });

  const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const [receipt] = await db.select().from(receipts).where(
    and(eq(receipts.id, receiptId), eq(receipts.businessId, business.id))
  );
  if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

  if (req.method === 'GET') {
    const items = await db.select().from(receiptItems).where(eq(receiptItems.receiptId, receiptId));
    return res.status(200).json({ ...receipt, items });
  }

  if (req.method === 'PUT') {
    const { items, ...receiptData } = req.body;

    const [updated] = await db.update(receipts)
      .set({ ...receiptData, updatedAt: new Date() })
      .where(eq(receipts.id, receiptId))
      .returning();

    if (items !== undefined) {
      await db.delete(receiptItems).where(eq(receiptItems.receiptId, receiptId));
      if (items.length > 0) {
        await db.insert(receiptItems).values(
          items.map((item: any, i: number) => ({ ...item, receiptId, sortOrder: i }))
        );
      }
    }

    const updatedItems = await db.select().from(receiptItems).where(eq(receiptItems.receiptId, receiptId));
    return res.status(200).json({ ...updated, items: updatedItems });
  }

  if (req.method === 'DELETE') {
    await db.delete(receipts).where(eq(receipts.id, receiptId));
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
