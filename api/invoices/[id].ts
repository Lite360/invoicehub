import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { invoices, invoiceItems, businesses } from '../../src/db/schema';
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

  const invoiceId = req.query.id as string;
  if (!invoiceId) return res.status(400).json({ error: 'Missing invoice ID' });

  const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
  if (!business) return res.status(404).json({ error: 'Business not found' });

  // Verify ownership
  const [invoice] = await db.select().from(invoices).where(
    and(eq(invoices.id, invoiceId), eq(invoices.businessId, business.id))
  );
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  // --- GET: Single invoice with items ---
  if (req.method === 'GET') {
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    return res.status(200).json({ ...invoice, items });
  }

  // --- PUT: Update invoice ---
  if (req.method === 'PUT') {
    const { items, ...invoiceData } = req.body;

    const [updated] = await db.update(invoices)
      .set({ ...invoiceData, updatedAt: new Date() })
      .where(eq(invoices.id, invoiceId))
      .returning();

    // Replace all items
    if (items !== undefined) {
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
      if (items.length > 0) {
        await db.insert(invoiceItems).values(
          items.map((item: any, i: number) => ({
            ...item,
            invoiceId,
            sortOrder: i,
          }))
        );
      }
    }

    const updatedItems = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    return res.status(200).json({ ...updated, items: updatedItems });
  }

  // --- DELETE ---
  if (req.method === 'DELETE') {
    await db.delete(invoices).where(eq(invoices.id, invoiceId));
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
