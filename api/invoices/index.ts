import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { invoices, invoiceItems, businesses } from '../../src/db/schema';
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

  // Get user's business
  const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
  if (!business) return res.status(404).json({ error: 'Business not found. Complete setup first.' });

  // --- GET: List all invoices ---
  if (req.method === 'GET') {
    const rows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.businessId, business.id))
      .orderBy(invoices.createdAt);

    return res.status(200).json(rows);
  }

  // --- POST: Create invoice ---
  if (req.method === 'POST') {
    const { items, ...invoiceData } = req.body;

    const [newInvoice] = await db.insert(invoices).values({
      ...invoiceData,
      businessId: business.id,
    }).returning();

    if (items && items.length > 0) {
      await db.insert(invoiceItems).values(
        items.map((item: any, i: number) => ({
          ...item,
          invoiceId: newInvoice.id,
          sortOrder: i,
        }))
      );
    }

    const insertedItems = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, newInvoice.id));
    return res.status(201).json({ ...newInvoice, items: insertedItems });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
