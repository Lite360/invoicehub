import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { payments, businesses, invoices } from '../../src/db/schema';
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
      .from(payments)
      .where(eq(payments.businessId, business.id))
      .orderBy(payments.createdAt);
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { invoiceId, ...paymentData } = req.body;

    const [newPayment] = await db.insert(payments).values({
      ...paymentData,
      invoiceId: invoiceId || null,
      businessId: business.id,
    }).returning();

    // If linked to an invoice, update the invoice's amountPaid and balanceDue
    if (invoiceId) {
      const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
      if (inv) {
        const newAmountPaid = Number(inv.amountPaid || 0) + Number(paymentData.amount || 0);
        const newBalance = Number(inv.total || 0) - newAmountPaid;
        const newStatus = newBalance <= 0 ? 'paid' : inv.status;

        await db.update(invoices).set({
          amountPaid: String(newAmountPaid),
          balanceDue: String(Math.max(0, newBalance)),
          status: newStatus,
          paidAt: newStatus === 'paid' ? new Date() : inv.paidAt,
          updatedAt: new Date(),
        }).where(eq(invoices.id, invoiceId));
      }
    }

    return res.status(201).json(newPayment);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
