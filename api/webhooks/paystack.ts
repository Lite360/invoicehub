import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { db } from '../../src/db';
import { invoices, payments, receipts, businesses } from '../../src/db/schema';
import { eq, and } from 'drizzle-orm';
import { getResendClient } from '../utils/emailClient';
import { render } from '@react-email/components';
import { ReceiptEmail } from '../../src/emails/ReceiptEmail';

// Verify Paystack webhook signature
function verifyPaystackSignature(body: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY || '';
  const hash = crypto
    .createHmac('sha512', secret)
    .update(body)
    .digest('hex');
  return hash === signature;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verify webhook signature
  const signature = req.headers['x-paystack-signature'] as string;
  const rawBody = JSON.stringify(req.body); // Note: requires raw body parser in production

  if (!verifyPaystackSignature(rawBody, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { event, data } = req.body;

  // Only handle successful charge events
  if (event !== 'charge.success') {
    return res.status(200).json({ received: true });
  }

  const { reference, amount, currency, metadata } = data;
  const { invoiceId } = metadata ?? {};

  if (!invoiceId) {
    return res.status(200).json({ received: true, note: 'No invoiceId in metadata' });
  }

  try {
    // 1. Fetch the invoice
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // 2. Idempotency — check if this reference was already processed
    // (In production: check your payments table for duplicate reference)
    const amountInNaira = amount / 100; // Paystack sends amounts in kobo

    // 3. Create a payment record
    await db.insert(payments).values({
      businessId: invoice.businessId,
      invoiceId: invoice.id,
      clientName: invoice.clientName,
      amount: String(amountInNaira),
      currency: currency ?? invoice.currency,
      paymentMethod: 'paystack',
      reference,
      status: 'completed',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: `Paystack payment — ref: ${reference}`,
    });

    // 4. Update invoice balance
    const newAmountPaid = Number(invoice.amountPaid || 0) + amountInNaira;
    const newBalance = Math.max(0, Number(invoice.total) - newAmountPaid);
    const newStatus = newBalance <= 0 ? 'paid' : 'sent';

    await db.update(invoices).set({
      amountPaid: String(newAmountPaid),
      balanceDue: String(newBalance),
      status: newStatus,
      paidAt: newStatus === 'paid' ? new Date() : invoice.paidAt,
      updatedAt: new Date(),
    }).where(eq(invoices.id, invoiceId));

    // 5. Auto-generate a receipt
    const [business] = await db.select().from(businesses).where(eq(businesses.id, invoice.businessId));
    const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;

    const [newReceipt] = await db.insert(receipts).values({
      businessId: invoice.businessId,
      invoiceId: invoice.id,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      clientPhone: invoice.clientPhone,
      clientAddress: invoice.clientAddress,
      receiptNumber,
      status: 'issued',
      paymentMethod: 'paystack',
      currency: currency ?? invoice.currency,
      issueDate: new Date().toISOString().split('T')[0],
      subtotal: String(amountInNaira),
      total: String(amountInNaira),
      notes: `Payment received via Paystack. Reference: ${reference}`,
    }).returning();

    console.log(`✅ Paystack webhook processed: Invoice ${invoice.invoiceNumber} — ${amountInNaira} ${currency}`);

    // 6. Send the Receipt Email
    if (invoice.clientEmail) {
      try {
        const resend = await getResendClient(business.ownerId);
        const host = req.headers.origin || `https://${req.headers.host}`;
        const dashboardLink = `${host}/login`;
        
        await resend.emails.send({
          from: 'InvoiceHub <billing@invoicehub.com>',
          to: [invoice.clientEmail],
          subject: `Payment Receipt ${receiptNumber} from ${business.name}`,
          html: await render(ReceiptEmail({ receipt: newReceipt, business, dashboardLink })),
        });
        console.log(`✅ Receipt email sent to ${invoice.clientEmail}`);
      } catch (emailErr) {
        console.error('Failed to send receipt email:', emailErr);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Paystack webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
