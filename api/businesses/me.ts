import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { businesses, brandingSettings, signatureSettings, watermarkSettings } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
    if (!business) return res.status(404).json({ error: 'No business found' });

    const [branding] = await db.select().from(brandingSettings).where(eq(brandingSettings.businessId, business.id));
    const [signature] = await db.select().from(signatureSettings).where(eq(signatureSettings.businessId, business.id));
    const [watermark] = await db.select().from(watermarkSettings).where(eq(watermarkSettings.businessId, business.id));

    return res.status(200).json({ business, branding, signature, watermark });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
