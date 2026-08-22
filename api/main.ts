import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { db } from '../src/db';
import {
  users, businesses, brandingSettings, signatureSettings, watermarkSettings,
  customers, invoices, invoiceItems, quotations, quotationItems,
  receipts, receiptItems, letters, payments, plans, subscriptions, userRoles,
} from '../src/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';
import { put } from '@vercel/blob';
import { getResendClient } from './_lib/emailClient';
import { render } from '@react-email/components';
import { InvoiceEmail } from '../src/emails/InvoiceEmail';
import { QuotationEmail } from '../src/emails/QuotationEmail';
import { ReceiptEmail } from '../src/emails/ReceiptEmail';

// ─── Supabase client (uses anon key for user auth validation) ───────────────
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// ─── Auth helpers ────────────────────────────────────────────────────────────
async function getUser(req: VercelRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

async function getAdminUser(req: VercelRequest) {
  const user = await getUser(req);
  if (!user) return null;
  const [role] = await db.select().from(userRoles).where(eq(userRoles.userId, user.id));
  return role ? user : null;
}

async function getBusinessForUser(userId: string) {
  const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, userId));
  return business || null;
}

// ─── Main catch-all handler ──────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`[API ROUTER] Request: ${req.method} ${req.url} | Segments:`, req.url ? req.url.replace(/^\/api\/?/, '').split('/').filter(Boolean) : []);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const pathname = req.url ? req.url.split('?')[0] : '';
  const segments = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const [seg0, seg1, seg2] = segments;

  try {
    // ── Health ──────────────────────────────────────────────────────────────
    if (seg0 === 'health' || segments.length === 0) {
      return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), message: 'InvoiceHub API is running' });
    }

    // ── Dashboard ───────────────────────────────────────────────────────────
    if (seg0 === 'dashboard') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const business = await getBusinessForUser(user.id);
      if (!business) return res.status(404).json({ error: 'Business not found' });

      const [allInvoices, allCustomers, allReceipts, allQuotations] = await Promise.all([
        db.select().from(invoices).where(eq(invoices.businessId, business.id)).orderBy(desc(invoices.createdAt)),
        db.select().from(customers).where(eq(customers.businessId, business.id)),
        db.select().from(receipts).where(eq(receipts.businessId, business.id)).orderBy(desc(receipts.createdAt)),
        db.select().from(quotations).where(eq(quotations.businessId, business.id)).orderBy(desc(quotations.createdAt)),
      ]);

      const paidCount = allInvoices.filter(i => i.status === 'paid').length;
      const pendingPayments = allInvoices
        .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
        .reduce((sum, inv) => sum + Number(inv.balanceDue || 0), 0);

      const activity = [
        ...allInvoices.map(i => ({ id: i.id, type: 'invoice', title: `Invoice ${i.invoiceNumber}`, subtitle: `For ${i.clientName} - ${i.currency} ${Number(i.total).toLocaleString()}`, date: i.createdAt, link: `/app/invoices/${i.id}`, icon: '🧾' })),
        ...allQuotations.map(q => ({ id: q.id, type: 'quotation', title: `Quotation ${q.quotationNumber}`, subtitle: `For ${q.clientName} - ${q.currency} ${Number(q.total).toLocaleString()}`, date: q.createdAt, link: `/app/quotations/${q.id}`, icon: '📋' })),
        ...allReceipts.map(r => ({ id: r.id, type: 'receipt', title: `Receipt ${r.receiptNumber}`, subtitle: `From ${r.clientName} - ${r.currency} ${Number(r.total).toLocaleString()}`, date: r.createdAt, link: `/app/receipts/${r.id}`, icon: '💵' })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

      return res.status(200).json({ stats: { totalInvoices: allInvoices.length, paidCount, pendingPayments, totalCustomers: allCustomers.length, currency: business.currency || 'NGN' }, recentActivity: activity });
    }

    // ── Settings ────────────────────────────────────────────────────────────
    if (seg0 === 'settings') {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      if (req.method === 'GET') {
        const [profile] = await db.select().from(users).where(eq(users.id, user.id));
        const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
        let branding = null, signature = null, watermark = null;
        if (business) {
          const [b] = await db.select().from(brandingSettings).where(eq(brandingSettings.businessId, business.id));
          const [s] = await db.select().from(signatureSettings).where(eq(signatureSettings.businessId, business.id));
          const [w] = await db.select().from(watermarkSettings).where(eq(watermarkSettings.businessId, business.id));
          branding = b || null; signature = s || null; watermark = w || null;
        }
        return res.status(200).json({ profile, business, branding, signature, watermark });
      }

      if (req.method === 'PUT') {
        const { section, data } = req.body;
        if (section === 'profile') {
          const [updated] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, user.id)).returning();
          return res.status(200).json(updated);
        }
        if (section === 'business') {
          const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
          if (!business) return res.status(404).json({ error: 'Business not found' });
          const [updated] = await db.update(businesses).set({ ...data, updatedAt: new Date() }).where(eq(businesses.id, business.id)).returning();
          return res.status(200).json(updated);
        }
        if (section === 'branding') {
          const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
          if (!business) return res.status(404).json({ error: 'Business not found' });
          const [existing] = await db.select().from(brandingSettings).where(eq(brandingSettings.businessId, business.id));
          if (existing) {
            const [updated] = await db.update(brandingSettings).set({ ...data, updatedAt: new Date() }).where(eq(brandingSettings.id, existing.id)).returning();
            return res.status(200).json(updated);
          }
          const [created] = await db.insert(brandingSettings).values({ ...data, businessId: business.id }).returning();
          return res.status(201).json(created);
        }
        return res.status(400).json({ error: 'Invalid section' });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── History ─────────────────────────────────────────────────────────────
    if (seg0 === 'history') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const business = await getBusinessForUser(user.id);
      if (!business) return res.status(404).json({ error: 'Business not found' });

      const [allInvoices, allQuotations, allReceipts, allLetters, allPayments] = await Promise.all([
        db.select().from(invoices).where(eq(invoices.businessId, business.id)).orderBy(desc(invoices.createdAt)),
        db.select().from(quotations).where(eq(quotations.businessId, business.id)).orderBy(desc(quotations.createdAt)),
        db.select().from(receipts).where(eq(receipts.businessId, business.id)).orderBy(desc(receipts.createdAt)),
        db.select().from(letters).where(eq(letters.businessId, business.id)).orderBy(desc(letters.createdAt)),
        db.select().from(payments).where(eq(payments.businessId, business.id)).orderBy(desc(payments.createdAt)),
      ]);

      const history = [
        ...allInvoices.map(i => ({ id: i.id, type: 'invoice', title: `Invoice ${i.invoiceNumber}`, client: i.clientName, status: i.status, date: i.createdAt, link: `/app/invoices/${i.id}` })),
        ...allQuotations.map(q => ({ id: q.id, type: 'quotation', title: `Quotation ${q.quotationNumber}`, client: q.clientName, status: q.status, date: q.createdAt, link: `/app/quotations/${q.id}` })),
        ...allReceipts.map(r => ({ id: r.id, type: 'receipt', title: `Receipt ${r.receiptNumber}`, client: r.clientName, status: r.status, date: r.createdAt, link: `/app/receipts/${r.id}` })),
        ...allLetters.map(l => ({ id: l.id, type: 'letter', title: `Letter to ${l.recipientName}`, client: l.recipientName, status: l.status, date: l.createdAt, link: `/app/letters/${l.id}` })),
        ...allPayments.map(p => ({ id: p.id, type: 'payment', title: `Payment Received: ${p.currency} ${p.amount}`, client: p.clientName, status: p.status, date: p.createdAt, link: `/app/payments` })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return res.status(200).json(history);
    }

    // ── Upload is handled by dedicated api/upload.ts ────────────────────────

    // ── Upload PDF ──────────────────────────────────────────────────────────
    if (seg0 === 'upload-pdf') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const business = await getBusinessForUser(user.id);
      if (!business) return res.status(404).json({ error: 'Business not found' });

      const { docId, docType, pdfBase64, filename } = req.body;
      if (!docId || !docType || !pdfBase64) return res.status(400).json({ error: 'Missing required fields' });

      const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const blob = await put(`documents/${docType}/${filename || `${docId}.pdf`}`, buffer, {
        access: 'public',
        contentType: 'application/pdf',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      const tableMap: Record<string, any> = { invoice: invoices, quotation: quotations, receipt: receipts, letter: letters };
      const table = tableMap[docType];
      if (!table) return res.status(400).json({ error: 'Invalid document type' });

      await db.update(table).set({ pdfUrl: blob.url, updatedAt: new Date() }).where(and(eq(table.id, docId), eq(table.businessId, business.id)));
      return res.status(200).json({ success: true, url: blob.url });
    }

    // ── Businesses ──────────────────────────────────────────────────────────
    if (seg0 === 'businesses') {
      if (seg1 === 'me') {
        const user = await getUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
        if (!business) return res.status(404).json({ error: 'No business found' });
        const [branding] = await db.select().from(brandingSettings).where(eq(brandingSettings.businessId, business.id));
        const [signature] = await db.select().from(signatureSettings).where(eq(signatureSettings.businessId, business.id));
        const [watermark] = await db.select().from(watermarkSettings).where(eq(watermarkSettings.businessId, business.id));
        return res.status(200).json({ business, branding, signature, watermark });
      }

      if (seg1 === 'setup') {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

        const { businessInfo, logoUrl, brandColors, defaultTemplate, signature, watermark } = req.body;
        await db.transaction(async (tx) => {
          // Ensure user exists in the public.users table to satisfy foreign key constraint
          const [existingUser] = await tx.select().from(users).where(eq(users.id, user.id));
          if (!existingUser) {
            await tx.insert(users).values({
              id: user.id,
              email: user.email || '',
              fullName: user.user_metadata?.full_name || 'Business Owner',
              phoneNumber: user.phone || null,
            });
          }

          const [newBusiness] = await tx.insert(businesses).values({
            ownerId: user.id, name: businessInfo.name, type: businessInfo.type, email: businessInfo.email,
            phone: businessInfo.phone, address: businessInfo.address, website: businessInfo.website,
            registrationNumber: businessInfo.registrationNumber, taxId: businessInfo.taxId, currency: businessInfo.currency,
          }).returning();
          await tx.insert(brandingSettings).values({ businessId: newBusiness.id, logoUrl, primaryColor: brandColors.primary, secondaryColor: brandColors.secondary, accentColor: brandColors.accent, backgroundColor: brandColors.background, textColor: brandColors.text, defaultTemplate });
          await tx.insert(signatureSettings).values({ businessId: newBusiness.id, signatureType: signature.type, signatureText: signature.text, signatureUrl: signature.url });
          await tx.insert(watermarkSettings).values({ businessId: newBusiness.id, enabled: watermark.enabled, type: watermark.type, text: watermark.text, opacity: watermark.opacity, position: watermark.position, rotation: watermark.rotation });
        });
        return res.status(200).json({ success: true, message: 'Company setup complete.' });
      }
    }

    // ── Customers ───────────────────────────────────────────────────────────
    if (seg0 === 'customers') {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const business = await getBusinessForUser(user.id);
      if (!business) return res.status(404).json({ error: 'Business not found' });

      if (!seg1) {
        if (req.method === 'GET') {
          const rows = await db.select().from(customers).where(eq(customers.businessId, business.id)).orderBy(customers.createdAt);
          return res.status(200).json(rows);
        }
        if (req.method === 'POST') {
          const [newCustomer] = await db.insert(customers).values({ ...req.body, businessId: business.id }).returning();
          return res.status(201).json(newCustomer);
        }
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const customerId = seg1;
      const [customer] = await db.select().from(customers).where(and(eq(customers.id, customerId), eq(customers.businessId, business.id)));
      if (!customer) return res.status(404).json({ error: 'Customer not found' });

      if (req.method === 'GET') {
        if (req.query.include === 'full') {
          const [custInvoices, custQuotations, custReceipts, custPayments] = await Promise.all([
            db.select().from(invoices).where(and(eq(invoices.customerId, customerId), eq(invoices.businessId, business.id))).orderBy(desc(invoices.createdAt)),
            db.select().from(quotations).where(and(eq(quotations.customerId, customerId), eq(quotations.businessId, business.id))).orderBy(desc(quotations.createdAt)),
            db.select().from(receipts).where(and(eq(receipts.customerId, customerId), eq(receipts.businessId, business.id))).orderBy(desc(receipts.createdAt)),
            db.select().from(payments).where(and(eq(payments.customerId, customerId), eq(payments.businessId, business.id))).orderBy(desc(payments.createdAt)),
          ]);
          const totalInvoiced = custInvoices.reduce((s, i) => s + Number(i.total), 0);
          const totalPaid = custInvoices.reduce((s, i) => s + Number(i.amountPaid || 0), 0);
          const outstanding = custInvoices.reduce((s, i) => s + Number(i.balanceDue || 0), 0);
          return res.status(200).json({ customer, invoices: custInvoices, quotations: custQuotations, receipts: custReceipts, payments: custPayments, stats: { totalInvoiced, totalPaid, outstanding } });
        }
        return res.status(200).json(customer);
      }
      if (req.method === 'PUT') {
        const [updated] = await db.update(customers).set({ ...req.body, updatedAt: new Date() }).where(eq(customers.id, customerId)).returning();
        return res.status(200).json(updated);
      }
      if (req.method === 'DELETE') {
        await db.delete(customers).where(eq(customers.id, customerId));
        return res.status(200).json({ success: true });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── Invoices ────────────────────────────────────────────────────────────
    if (seg0 === 'invoices') {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const business = await getBusinessForUser(user.id);
      if (!business) return res.status(404).json({ error: 'Business not found. Complete setup first.' });

      if (seg1 === 'send') {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        const { invoiceId } = req.body;
        if (!invoiceId) return res.status(400).json({ error: 'Missing invoiceId' });
        const [invoice] = await db.select().from(invoices).where(and(eq(invoices.id, invoiceId), eq(invoices.businessId, business.id)));
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        if (!invoice.clientEmail) return res.status(400).json({ error: 'Customer has no email address' });
        const host = req.headers.origin || `https://${req.headers.host}`;
        const resend = getResendClient(user.id);
        await resend.emails.send({ from: 'InvoiceHub <billing@invoicehub.com>', to: [invoice.clientEmail], subject: `Invoice ${invoice.invoiceNumber} from ${business.name}`, html: await render(InvoiceEmail({ invoice, business, paymentLink: `${host}/pay/${invoice.id}` })) });
        if (invoice.status === 'draft') await db.update(invoices).set({ status: 'sent', updatedAt: new Date() }).where(eq(invoices.id, invoiceId));
        return res.status(200).json({ success: true, message: 'Invoice sent successfully' });
      }

      if (!seg1) {
        if (req.method === 'GET') {
          const rows = await db.select().from(invoices).where(eq(invoices.businessId, business.id)).orderBy(invoices.createdAt);
          return res.status(200).json(rows);
        }
        if (req.method === 'POST') {
          const { items, ...invoiceData } = req.body;
          const [newInvoice] = await db.insert(invoices).values({ ...invoiceData, businessId: business.id }).returning();
          if (items && items.length > 0) await db.insert(invoiceItems).values(items.map((item: any, i: number) => ({ ...item, invoiceId: newInvoice.id, sortOrder: i })));
          const insertedItems = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, newInvoice.id));
          return res.status(201).json({ ...newInvoice, items: insertedItems });
        }
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const invoiceId = seg1;
      const [invoice] = await db.select().from(invoices).where(and(eq(invoices.id, invoiceId), eq(invoices.businessId, business.id)));
      if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

      if (req.method === 'GET') {
        const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
        return res.status(200).json({ ...invoice, items });
      }
      if (req.method === 'PUT') {
        const { items, ...invoiceData } = req.body;
        const [updated] = await db.update(invoices).set({ ...invoiceData, updatedAt: new Date() }).where(eq(invoices.id, invoiceId)).returning();
        if (items !== undefined) {
          await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
          if (items.length > 0) await db.insert(invoiceItems).values(items.map((item: any, i: number) => ({ ...item, invoiceId, sortOrder: i })));
        }
        const updatedItems = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
        return res.status(200).json({ ...updated, items: updatedItems });
      }
      if (req.method === 'DELETE') {
        await db.delete(invoices).where(eq(invoices.id, invoiceId));
        return res.status(200).json({ success: true });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── Quotations ──────────────────────────────────────────────────────────
    if (seg0 === 'quotations') {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const business = await getBusinessForUser(user.id);
      if (!business) return res.status(404).json({ error: 'Business not found. Complete setup first.' });

      if (seg1 === 'send') {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        const { quotationId } = req.body;
        if (!quotationId) return res.status(400).json({ error: 'Missing quotationId' });
        const [quotation] = await db.select().from(quotations).where(and(eq(quotations.id, quotationId), eq(quotations.businessId, business.id)));
        if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
        if (!quotation.clientEmail) return res.status(400).json({ error: 'Customer has no email address' });
        const resend = getResendClient(user.id);
        await resend.emails.send({ from: 'InvoiceHub <billing@invoicehub.com>', to: [quotation.clientEmail], subject: `Quotation ${quotation.quotationNumber} from ${business.name}`, html: await render(QuotationEmail({ quotation, business })) });
        if (quotation.status === 'draft') await db.update(quotations).set({ status: 'sent', updatedAt: new Date() }).where(eq(quotations.id, quotationId));
        return res.status(200).json({ success: true, message: 'Quotation sent successfully' });
      }

      if (!seg1) {
        if (req.method === 'GET') {
          const rows = await db.select().from(quotations).where(eq(quotations.businessId, business.id)).orderBy(quotations.createdAt);
          return res.status(200).json(rows);
        }
        if (req.method === 'POST') {
          const { items, ...quotationData } = req.body;
          const [newQuotation] = await db.insert(quotations).values({ ...quotationData, businessId: business.id }).returning();
          if (items && items.length > 0) await db.insert(quotationItems).values(items.map((item: any, i: number) => ({ ...item, quotationId: newQuotation.id, sortOrder: i })));
          const insertedItems = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, newQuotation.id));
          return res.status(201).json({ ...newQuotation, items: insertedItems });
        }
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const quotationId = seg1;
      const [quotation] = await db.select().from(quotations).where(and(eq(quotations.id, quotationId), eq(quotations.businessId, business.id)));
      if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

      if (req.method === 'GET') {
        const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, quotationId));
        return res.status(200).json({ ...quotation, items });
      }
      if (req.method === 'PUT') {
        const { items, action, ...quotationData } = req.body;
        if (action === 'convert') {
          const qItems = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, quotationId));
          const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
          const [newInvoice] = await db.insert(invoices).values({ businessId: business.id, clientName: quotation.clientName, clientEmail: quotation.clientEmail ?? undefined, clientPhone: quotation.clientPhone ?? undefined, clientAddress: quotation.clientAddress ?? undefined, invoiceNumber, status: 'draft', currency: quotation.currency, issueDate: new Date().toISOString().split('T')[0], subtotal: quotation.subtotal, taxRate: quotation.taxRate ?? undefined, taxAmount: quotation.taxAmount ?? undefined, discountType: quotation.discountType ?? undefined, discountValue: quotation.discountValue ?? undefined, discountAmount: quotation.discountAmount ?? undefined, total: quotation.total, balanceDue: quotation.total, notes: quotation.notes ?? undefined }).returning();
          if (qItems.length > 0) await db.insert(invoiceItems).values(qItems.map((item, i) => ({ invoiceId: newInvoice.id, description: item.description, quantity: item.quantity, unitPrice: item.unitPrice, amount: item.amount, sortOrder: i })));
          await db.update(quotations).set({ status: 'accepted', convertedToInvoiceId: newInvoice.id, updatedAt: new Date() }).where(eq(quotations.id, quotationId));
          return res.status(200).json({ invoiceId: newInvoice.id });
        }
        const [updated] = await db.update(quotations).set({ ...quotationData, updatedAt: new Date() }).where(eq(quotations.id, quotationId)).returning();
        if (items !== undefined) {
          await db.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId));
          if (items.length > 0) await db.insert(quotationItems).values(items.map((item: any, i: number) => ({ ...item, quotationId, sortOrder: i })));
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

    // ── Receipts ────────────────────────────────────────────────────────────
    if (seg0 === 'receipts') {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const business = await getBusinessForUser(user.id);
      if (!business) return res.status(404).json({ error: 'Business not found' });

      if (!seg1) {
        if (req.method === 'GET') {
          const rows = await db.select().from(receipts).where(eq(receipts.businessId, business.id)).orderBy(receipts.createdAt);
          return res.status(200).json(rows);
        }
        if (req.method === 'POST') {
          const { items, ...receiptData } = req.body;
          const [newReceipt] = await db.insert(receipts).values({ ...receiptData, businessId: business.id }).returning();
          if (items && items.length > 0) await db.insert(receiptItems).values(items.map((item: any, i: number) => ({ ...item, receiptId: newReceipt.id, sortOrder: i })));
          const insertedItems = await db.select().from(receiptItems).where(eq(receiptItems.receiptId, newReceipt.id));
          return res.status(201).json({ ...newReceipt, items: insertedItems });
        }
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const receiptId = seg1;
      const [receipt] = await db.select().from(receipts).where(and(eq(receipts.id, receiptId), eq(receipts.businessId, business.id)));
      if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

      if (req.method === 'GET') {
        const items = await db.select().from(receiptItems).where(eq(receiptItems.receiptId, receiptId));
        return res.status(200).json({ ...receipt, items });
      }
      if (req.method === 'PUT') {
        const { items, ...receiptData } = req.body;
        const [updated] = await db.update(receipts).set({ ...receiptData, updatedAt: new Date() }).where(eq(receipts.id, receiptId)).returning();
        if (items !== undefined) {
          await db.delete(receiptItems).where(eq(receiptItems.receiptId, receiptId));
          if (items.length > 0) await db.insert(receiptItems).values(items.map((item: any, i: number) => ({ ...item, receiptId, sortOrder: i })));
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

    // ── Letters ─────────────────────────────────────────────────────────────
    if (seg0 === 'letters') {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const business = await getBusinessForUser(user.id);
      if (!business) return res.status(404).json({ error: 'Business not found' });

      if (!seg1) {
        if (req.method === 'GET') {
          const rows = await db.select().from(letters).where(eq(letters.businessId, business.id)).orderBy(letters.createdAt);
          return res.status(200).json(rows);
        }
        if (req.method === 'POST') {
          const [newLetter] = await db.insert(letters).values({ ...req.body, businessId: business.id }).returning();
          return res.status(201).json(newLetter);
        }
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const letterId = seg1;
      const [letter] = await db.select().from(letters).where(and(eq(letters.id, letterId), eq(letters.businessId, business.id)));
      if (!letter) return res.status(404).json({ error: 'Letter not found' });

      if (req.method === 'GET') return res.status(200).json(letter);
      if (req.method === 'PUT') {
        const [updated] = await db.update(letters).set({ ...req.body, updatedAt: new Date() }).where(eq(letters.id, letterId)).returning();
        return res.status(200).json(updated);
      }
      if (req.method === 'DELETE') {
        await db.delete(letters).where(eq(letters.id, letterId));
        return res.status(200).json({ success: true });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── Payments ────────────────────────────────────────────────────────────
    if (seg0 === 'payments') {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const business = await getBusinessForUser(user.id);
      if (!business) return res.status(404).json({ error: 'Business not found' });

      if (!seg1) {
        if (req.method === 'GET') {
          const rows = await db.select().from(payments).where(eq(payments.businessId, business.id)).orderBy(payments.createdAt);
          return res.status(200).json(rows);
        }
        if (req.method === 'POST') {
          const { invoiceId, ...paymentData } = req.body;
          const [newPayment] = await db.insert(payments).values({ ...paymentData, invoiceId: invoiceId || null, businessId: business.id }).returning();
          if (invoiceId) {
            const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
            if (inv) {
              const newAmountPaid = Number(inv.amountPaid || 0) + Number(paymentData.amount || 0);
              const newBalance = Number(inv.total || 0) - newAmountPaid;
              const newStatus = newBalance <= 0 ? 'paid' : inv.status;
              await db.update(invoices).set({ amountPaid: String(newAmountPaid), balanceDue: String(Math.max(0, newBalance)), status: newStatus, paidAt: newStatus === 'paid' ? new Date() : inv.paidAt, updatedAt: new Date() }).where(eq(invoices.id, invoiceId));
            }
          }
          return res.status(201).json(newPayment);
        }
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const paymentId = seg1;
      const [payment] = await db.select().from(payments).where(and(eq(payments.id, paymentId), eq(payments.businessId, business.id)));
      if (!payment) return res.status(404).json({ error: 'Payment not found' });

      if (req.method === 'GET') return res.status(200).json(payment);
      if (req.method === 'DELETE') {
        await db.delete(payments).where(eq(payments.id, paymentId));
        return res.status(200).json({ success: true });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── Subscription ────────────────────────────────────────────────────────
    if (seg0 === 'subscription') {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const business = await getBusinessForUser(user.id);
      if (!business) return res.status(404).json({ error: 'Business not found' });

      if (!seg1 || seg1 === 'index') {
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        const [subscription] = await db.select({ id: subscriptions.id, planId: subscriptions.planId, status: subscriptions.status, billingCycle: subscriptions.billingCycle, currentPeriodStart: subscriptions.currentPeriodStart, currentPeriodEnd: subscriptions.currentPeriodEnd, cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd, planName: plans.name, planDescription: plans.description, weeklyPrice: plans.weeklyPrice, monthlyPrice: plans.monthlyPrice, yearlyPrice: plans.yearlyPrice, invoiceLimit: plans.invoiceLimit, customerLimit: plans.customerLimit, features: plans.features }).from(subscriptions).leftJoin(plans, eq(plans.id, subscriptions.planId)).where(eq(subscriptions.businessId, business.id));
        const allPlans = await db.select().from(plans).where(eq(plans.status, 'active'));
        const recentPayments = await db.select().from(payments).where(eq(payments.businessId, business.id)).orderBy(desc(payments.createdAt)).limit(10);
        return res.status(200).json({ subscription, plans: allPlans, recentPayments, currency: business.currency });
      }

      if (seg1 === 'initiate') {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        const { planId, billingCycle } = req.body;
        if (!planId || !billingCycle) return res.status(400).json({ error: 'planId and billingCycle are required' });
        const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
        if (!plan || plan.status !== 'active') return res.status(404).json({ error: 'Plan not found or inactive' });
        const priceField = billingCycle === 'weekly' ? 'weeklyPrice' : billingCycle === 'yearly' ? 'yearlyPrice' : 'monthlyPrice';
        const planPrice = Number(plan[priceField] || 0);
        if (planPrice <= 0) return res.status(400).json({ error: 'This plan has no price for the selected billing cycle' });
        const amountInKobo = Math.round(planPrice * 100);
        const reference = `SUB-${business.id.slice(0, 8)}-${Date.now()}`;
        const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', { method: 'POST', headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, amount: amountInKobo, currency: business.currency || 'NGN', reference, metadata: { type: 'subscription', businessId: business.id, planId, billingCycle }, callback_url: `${req.headers.origin || `https://${req.headers.host}`}/app/subscription?status=success` }) });
        const paystackData = await paystackRes.json();
        if (!paystackData.status) return res.status(500).json({ error: paystackData.message || 'Paystack initialization failed' });
        return res.status(200).json({ authorizationUrl: paystackData.data.authorization_url, reference: paystackData.data.reference, planName: plan.name, amount: planPrice, billingCycle });
      }
    }

    // ── Pay (PUBLIC — no auth required) ─────────────────────────────────────
    if (seg0 === 'pay') {
      if (seg1 === 'initiate') {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        const { invoiceId, email, amountOverride } = req.body ?? {};
        if (!invoiceId) return res.status(400).json({ error: 'invoiceId is required' });
        const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        if (invoice.status === 'paid' || invoice.status === 'cancelled') return res.status(400).json({ error: `Invoice is already ${invoice.status}` });
        const balanceDue = Number(invoice.balanceDue ?? invoice.total);
        if (balanceDue <= 0) return res.status(400).json({ error: 'No balance due on this invoice' });
        let chargeAmount = balanceDue;
        if (amountOverride && Number(amountOverride) > 0) chargeAmount = Math.min(Number(amountOverride), balanceDue);
        const customerEmail = email || invoice.clientEmail;
        if (!customerEmail) return res.status(400).json({ error: 'Customer email is required to initiate payment' });
        const amountInKobo = Math.round(chargeAmount * 100);
        const reference = `INV-${invoice.invoiceNumber}-${Date.now()}`;
        const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', { method: 'POST', headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: customerEmail, amount: amountInKobo, currency: invoice.currency || 'NGN', reference, metadata: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, clientName: invoice.clientName }, callback_url: `${req.headers.origin || `https://${req.headers.host}`}/pay/${invoiceId}?status=success` }) });
        const paystackData = await paystackRes.json();
        if (!paystackData.status) return res.status(500).json({ error: paystackData.message || 'Paystack initialization failed' });
        return res.status(200).json({ authorizationUrl: paystackData.data.authorization_url, reference: paystackData.data.reference, amountKobo: amountInKobo, amountNaira: chargeAmount });
      }

      if (seg1 && req.method === 'GET') {
        const invoiceId = seg1;
        const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        const [items, business, branding] = await Promise.all([
          db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId)),
          db.select().from(businesses).where(eq(businesses.id, invoice.businessId)).then(r => r[0]),
          db.select().from(brandingSettings).where(eq(brandingSettings.businessId, invoice.businessId)).then(r => r[0]),
        ]);
        return res.status(200).json({ invoice: { id: invoice.id, invoiceNumber: invoice.invoiceNumber, clientName: invoice.clientName, status: invoice.status, currency: invoice.currency, issueDate: invoice.issueDate, dueDate: invoice.dueDate, subtotal: invoice.subtotal, taxAmount: invoice.taxAmount, discountAmount: invoice.discountAmount, total: invoice.total, amountPaid: invoice.amountPaid, balanceDue: invoice.balanceDue, notes: invoice.notes, items }, business: { name: business?.name, email: business?.email, phone: business?.phone, address: business?.address, website: business?.website }, branding: { logoUrl: branding?.logoUrl, primaryColor: branding?.primaryColor, accentColor: branding?.accentColor } });
      }
    }

    // ── Webhooks ────────────────────────────────────────────────────────────
    if (seg0 === 'webhooks' && seg1 === 'paystack') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const signature = req.headers['x-paystack-signature'] as string;
      const rawBody = JSON.stringify(req.body);
      const secret = process.env.PAYSTACK_SECRET_KEY || '';
      const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
      if (hash !== signature) return res.status(401).json({ error: 'Invalid signature' });

      const { event, data } = req.body;
      if (event !== 'charge.success') return res.status(200).json({ received: true });

      const { reference, amount, currency, metadata } = data;
      const { invoiceId } = metadata ?? {};
      if (!invoiceId) return res.status(200).json({ received: true, note: 'No invoiceId in metadata' });

      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
      if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

      const amountInNaira = amount / 100;
      await db.insert(payments).values({ businessId: invoice.businessId, invoiceId: invoice.id, clientName: invoice.clientName, amount: String(amountInNaira), currency: currency ?? invoice.currency, paymentMethod: 'paystack', reference, status: 'completed', paymentDate: new Date().toISOString().split('T')[0], notes: `Paystack payment — ref: ${reference}` });

      const newAmountPaid = Number(invoice.amountPaid || 0) + amountInNaira;
      const newBalance = Math.max(0, Number(invoice.total) - newAmountPaid);
      const newStatus = newBalance <= 0 ? 'paid' : 'sent';
      await db.update(invoices).set({ amountPaid: String(newAmountPaid), balanceDue: String(newBalance), status: newStatus, paidAt: newStatus === 'paid' ? new Date() : invoice.paidAt, updatedAt: new Date() }).where(eq(invoices.id, invoiceId));

      const [bizForReceipt] = await db.select().from(businesses).where(eq(businesses.id, invoice.businessId));
      const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;
      const [newReceipt] = await db.insert(receipts).values({ businessId: invoice.businessId, invoiceId: invoice.id, clientName: invoice.clientName, clientEmail: invoice.clientEmail, clientPhone: invoice.clientPhone, clientAddress: invoice.clientAddress, receiptNumber, status: 'issued', paymentMethod: 'paystack', currency: currency ?? invoice.currency, issueDate: new Date().toISOString().split('T')[0], subtotal: String(amountInNaira), total: String(amountInNaira), notes: `Payment received via Paystack. Reference: ${reference}` }).returning();

      if (invoice.clientEmail) {
        try {
          const resend = getResendClient(bizForReceipt.ownerId);
          const host = req.headers.origin || `https://${req.headers.host}`;
          await resend.emails.send({ from: 'InvoiceHub <billing@invoicehub.com>', to: [invoice.clientEmail], subject: `Payment Receipt ${receiptNumber} from ${bizForReceipt.name}`, html: await render(ReceiptEmail({ receipt: newReceipt, business: bizForReceipt, dashboardLink: `${host}/login` })) });
        } catch (emailErr) {
          console.error('Failed to send receipt email:', emailErr);
        }
      }
      return res.status(200).json({ success: true });
    }

    // ── Admin ───────────────────────────────────────────────────────────────
    if (seg0 === 'admin') {
      const admin = await getAdminUser(req);
      if (!admin) return res.status(403).json({ error: 'Forbidden: Admin access required' });

      if (seg1 === 'stats') {
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        const [[{ value: totalUsers }], [{ value: totalBusinesses }], allSubscriptions, allPayments, [{ value: totalInvoices }], [{ value: totalQuotations }], [{ value: totalReceipts }], [{ value: totalLetters }]] = await Promise.all([
          db.select({ value: count() }).from(users),
          db.select({ value: count() }).from(businesses),
          db.select().from(subscriptions),
          db.select().from(payments),
          db.select({ value: count() }).from(invoices),
          db.select({ value: count() }).from(quotations),
          db.select({ value: count() }).from(receipts),
          db.select({ value: count() }).from(letters),
        ]);
        const activeSubscriptions = allSubscriptions.filter(s => s.status === 'active').length;
        const trialSubscriptions = allSubscriptions.filter(s => s.status === 'trial').length;
        const successfulPayments = allPayments.filter(p => p.status === 'completed');
        const failedPayments = allPayments.filter(p => p.status === 'failed').length;
        const totalRevenue = successfulPayments.reduce((s, p) => s + Number(p.amount), 0);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const mrr = successfulPayments.filter(p => new Date(p.createdAt) >= startOfMonth).reduce((s, p) => s + Number(p.amount), 0);
        return res.status(200).json({ totalUsers, totalBusinesses, activeSubscriptions, trialUsers: trialSubscriptions, monthlyRevenue: mrr, totalRevenue, totalDocuments: Number(totalInvoices) + Number(totalQuotations) + Number(totalReceipts) + Number(totalLetters), totalInvoices, totalQuotations, totalReceipts, successfulPayments: successfulPayments.length, failedPayments });
      }

      if (seg1 === 'users') {
        if (req.method === 'GET') {
          const page = parseInt(req.query.page as string) || 1;
          const limit = parseInt(req.query.limit as string) || 20;
          const offset = (page - 1) * limit;
          const allUsers = await db.select({ id: users.id, email: users.email, fullName: users.fullName, phoneNumber: users.phoneNumber, createdAt: users.createdAt, businessName: businesses.name, businessId: businesses.id }).from(users).leftJoin(businesses, eq(businesses.ownerId, users.id)).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
          return res.status(200).json({ users: allUsers, page, limit });
        }
        if (req.method === 'POST') {
          const { userId, action } = req.body;
          if (!userId || !action) return res.status(400).json({ error: 'userId and action required' });
          return res.status(200).json({ success: true, note: 'User management requires service role key configured in admin settings' });
        }
        return res.status(405).json({ error: 'Method not allowed' });
      }

      if (seg1 === 'businesses') {
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;
        const allBusinesses = await db.select({ id: businesses.id, name: businesses.name, type: businesses.type, email: businesses.email, phone: businesses.phone, currency: businesses.currency, createdAt: businesses.createdAt, ownerEmail: users.email, ownerName: users.fullName, planId: subscriptions.planId, planName: plans.name, subscriptionStatus: subscriptions.status }).from(businesses).leftJoin(users, eq(users.id, businesses.ownerId)).leftJoin(subscriptions, eq(subscriptions.businessId, businesses.id)).leftJoin(plans, eq(plans.id, subscriptions.planId)).orderBy(desc(businesses.createdAt)).limit(limit).offset(offset);
        return res.status(200).json({ businesses: allBusinesses, page, limit });
      }

      if (seg1 === 'plans') {
        if (req.method === 'GET') {
          const allPlans = await db.select().from(plans);
          return res.status(200).json(allPlans);
        }
        if (req.method === 'POST') {
          const { id, name, description, weeklyPrice, monthlyPrice, yearlyPrice, invoiceLimit, customerLimit, teamMemberLimit, features, status } = req.body;
          const [plan] = await db.insert(plans).values({ id: id || name.toLowerCase().replace(/\s+/g, '_'), name, description, weeklyPrice: String(weeklyPrice || 0), monthlyPrice: String(monthlyPrice || 0), yearlyPrice: String(yearlyPrice || 0), invoiceLimit, customerLimit, teamMemberLimit: teamMemberLimit || 1, features: JSON.stringify(features || []), status: status || 'active' }).returning();
          return res.status(201).json(plan);
        }
        if (req.method === 'PUT') {
          const planId = seg2 || (req.query.id as string);
          if (!planId) return res.status(400).json({ error: 'Plan ID required' });
          const { name, description, weeklyPrice, monthlyPrice, yearlyPrice, invoiceLimit, customerLimit, teamMemberLimit, features, status } = req.body;
          const [updated] = await db.update(plans).set({ name, description, weeklyPrice: String(weeklyPrice || 0), monthlyPrice: String(monthlyPrice || 0), yearlyPrice: String(yearlyPrice || 0), invoiceLimit, customerLimit, teamMemberLimit: teamMemberLimit || 1, features: JSON.stringify(features || []), status, updatedAt: new Date() }).where(eq(plans.id, planId)).returning();
          return res.status(200).json(updated);
        }
        return res.status(405).json({ error: 'Method not allowed' });
      }

      if (seg1 === 'payments') {
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = (page - 1) * limit;
        const allPayments = await db.select({ id: payments.id, businessId: payments.businessId, businessName: businesses.name, clientName: payments.clientName, amount: payments.amount, currency: payments.currency, paymentMethod: payments.paymentMethod, reference: payments.reference, status: payments.status, paymentDate: payments.paymentDate, notes: payments.notes, createdAt: payments.createdAt }).from(payments).leftJoin(businesses, eq(businesses.id, payments.businessId)).orderBy(desc(payments.createdAt)).limit(limit).offset(offset);
        return res.status(200).json({ payments: allPayments, page, limit });
      }
    }

    // ── 404 ─────────────────────────────────────────────────────────────────
    return res.status(404).json({ error: 'Route not found', path: `/${segments.join('/')}` });

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
