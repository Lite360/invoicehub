import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { invoices } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// POST /api/pay/initiate — initialize a Paystack payment for an invoice
// This is a PUBLIC endpoint (no auth required) — the customer initiates payment
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { invoiceId, email, amountOverride } = req.body ?? {};

  if (!invoiceId) return res.status(400).json({ error: 'invoiceId is required' });

  try {
    // Fetch invoice from DB — NEVER trust the amount from the frontend
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      return res.status(400).json({ error: `Invoice is already ${invoice.status}` });
    }

    const balanceDue = Number(invoice.balanceDue ?? invoice.total);
    if (balanceDue <= 0) {
      return res.status(400).json({ error: 'No balance due on this invoice' });
    }

    // Determine amount to charge (kobo for NGN)
    // If partial payments are enabled, amountOverride can be used (but must be <= balanceDue)
    let chargeAmount = balanceDue;
    if (amountOverride && Number(amountOverride) > 0) {
      chargeAmount = Math.min(Number(amountOverride), balanceDue);
    }

    const customerEmail = email || invoice.clientEmail;
    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email is required to initiate payment' });
    }

    const amountInKobo = Math.round(chargeAmount * 100);
    const reference = `INV-${invoice.invoiceNumber}-${Date.now()}`;

    // Initialize Paystack transaction
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: customerEmail,
        amount: amountInKobo,
        currency: invoice.currency || 'NGN',
        reference,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientName,
        },
        callback_url: `${req.headers.origin || `https://${req.headers.host}`}/pay/${invoiceId}?status=success`,
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return res.status(500).json({ error: paystackData.message || 'Paystack initialization failed' });
    }

    return res.status(200).json({
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
      amountKobo: amountInKobo,
      amountNaira: chargeAmount,
    });
  } catch (error: any) {
    console.error('Pay initiate error:', error);
    return res.status(500).json({ error: error.message });
  }
}
