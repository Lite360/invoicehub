import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { invoices, invoiceItems, businesses, brandingSettings } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const invoiceId = req.query.id as string;
  if (!invoiceId) return res.status(400).json({ error: 'Missing invoice ID' });

  try {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Only expose non-sensitive public info
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    const [business] = await db.select().from(businesses).where(eq(businesses.id, invoice.businessId));
    const [branding] = await db.select().from(brandingSettings).where(eq(brandingSettings.businessId, invoice.businessId));

    return res.status(200).json({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        status: invoice.status,
        currency: invoice.currency,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        discountAmount: invoice.discountAmount,
        total: invoice.total,
        amountPaid: invoice.amountPaid,
        balanceDue: invoice.balanceDue,
        notes: invoice.notes,
        items,
      },
      business: {
        name: business?.name,
        email: business?.email,
        phone: business?.phone,
        address: business?.address,
        website: business?.website,
      },
      branding: {
        logoUrl: branding?.logoUrl,
        primaryColor: branding?.primaryColor,
        accentColor: branding?.accentColor,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
