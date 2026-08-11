import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { quotations, quotationItems, invoices, invoiceItems, businesses } from '../../src/db/schema';
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

  const quotationId = req.query.id as string;
  if (!quotationId) return res.status(400).json({ error: 'Missing quotation ID' });

  const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const [quotation] = await db.select().from(quotations).where(
    and(eq(quotations.id, quotationId), eq(quotations.businessId, business.id))
  );
  if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

  if (req.method === 'GET') {
    const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, quotationId));
    return res.status(200).json({ ...quotation, items });
  }

  if (req.method === 'PUT') {
    const { items, action, ...quotationData } = req.body;

    // Special action: convert to invoice
    if (action === 'convert') {
      const qItems = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, quotationId));
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

      const [newInvoice] = await db.insert(invoices).values({
        businessId: business.id,
        clientName: quotation.clientName,
        clientEmail: quotation.clientEmail ?? undefined,
        clientPhone: quotation.clientPhone ?? undefined,
        clientAddress: quotation.clientAddress ?? undefined,
        invoiceNumber,
        status: 'draft',
        currency: quotation.currency,
        issueDate: new Date().toISOString().split('T')[0],
        subtotal: quotation.subtotal,
        taxRate: quotation.taxRate ?? undefined,
        taxAmount: quotation.taxAmount ?? undefined,
        discountType: quotation.discountType ?? undefined,
        discountValue: quotation.discountValue ?? undefined,
        discountAmount: quotation.discountAmount ?? undefined,
        total: quotation.total,
        balanceDue: quotation.total,
        notes: quotation.notes ?? undefined,
      }).returning();

      if (qItems.length > 0) {
        await db.insert(invoiceItems).values(
          qItems.map((item, i) => ({
            invoiceId: newInvoice.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            sortOrder: i,
          }))
        );
      }

      // Mark quotation as accepted and linked
      await db.update(quotations)
        .set({ status: 'accepted', convertedToInvoiceId: newInvoice.id, updatedAt: new Date() })
        .where(eq(quotations.id, quotationId));

      return res.status(200).json({ invoiceId: newInvoice.id });
    }

    const [updated] = await db.update(quotations)
      .set({ ...quotationData, updatedAt: new Date() })
      .where(eq(quotations.id, quotationId))
      .returning();

    if (items !== undefined) {
      await db.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId));
      if (items.length > 0) {
        await db.insert(quotationItems).values(
          items.map((item: any, i: number) => ({ ...item, quotationId, sortOrder: i }))
        );
      }
    }

    const updatedItems = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, quotationId));
    return res.status(200).json({ ...updated, items: updatedItems });
  }

  if (req.method === 'DELETE') {
    await db.delete(quotations).where(eq(quotations.id, quotationId));
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
