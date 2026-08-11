import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { quotations, quotationItems, businesses } from '../../src/db/schema';
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
  if (!business) return res.status(404).json({ error: 'Business not found. Complete setup first.' });

  if (req.method === 'GET') {
    const rows = await db
      .select()
      .from(quotations)
      .where(eq(quotations.businessId, business.id))
      .orderBy(quotations.createdAt);
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { items, ...quotationData } = req.body;
    const [newQuotation] = await db.insert(quotations).values({
      ...quotationData,
      businessId: business.id,
    }).returning();

    if (items && items.length > 0) {
      await db.insert(quotationItems).values(
        items.map((item: any, i: number) => ({
          ...item,
          quotationId: newQuotation.id,
          sortOrder: i,
        }))
      );
    }

    const insertedItems = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, newQuotation.id));
    return res.status(201).json({ ...newQuotation, items: insertedItems });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
