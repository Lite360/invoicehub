import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { businesses, plans } from '../../src/db/schema';
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

// POST /api/subscription/initiate — initialize a Paystack transaction for subscription
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const { planId, billingCycle } = req.body;
  if (!planId || !billingCycle) return res.status(400).json({ error: 'planId and billingCycle are required' });

  // Fetch plan from DB — never trust frontend price
  const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
  if (!plan || plan.status !== 'active') return res.status(404).json({ error: 'Plan not found or inactive' });

  const priceField = billingCycle === 'weekly' ? 'weeklyPrice' : billingCycle === 'yearly' ? 'yearlyPrice' : 'monthlyPrice';
  const planPrice = Number(plan[priceField] || 0);
  if (planPrice <= 0) return res.status(400).json({ error: 'This plan has no price for the selected billing cycle' });

  const amountInKobo = Math.round(planPrice * 100);
  const reference = `SUB-${business.id.slice(0, 8)}-${Date.now()}`;

  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount: amountInKobo,
      currency: business.currency || 'NGN',
      reference,
      metadata: {
        type: 'subscription',
        businessId: business.id,
        planId,
        billingCycle,
      },
      callback_url: `${req.headers.origin || `https://${req.headers.host}`}/app/subscription?status=success`,
    }),
  });

  const paystackData = await paystackRes.json();
  if (!paystackData.status) {
    return res.status(500).json({ error: paystackData.message || 'Paystack initialization failed' });
  }

  return res.status(200).json({
    authorizationUrl: paystackData.data.authorization_url,
    reference: paystackData.data.reference,
    planName: plan.name,
    amount: planPrice,
    billingCycle,
  });
}
