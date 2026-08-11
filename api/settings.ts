import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/db';
import { users, businesses, brandingSettings, signatureSettings, watermarkSettings } from '../src/db/schema';
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

  if (req.method === 'GET') {
    const [profile] = await db.select().from(users).where(eq(users.id, user.id));
    const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
    
    let branding = null;
    let signature = null;
    let watermark = null;
    
    if (business) {
      const [b] = await db.select().from(brandingSettings).where(eq(brandingSettings.businessId, business.id));
      const [s] = await db.select().from(signatureSettings).where(eq(signatureSettings.businessId, business.id));
      const [w] = await db.select().from(watermarkSettings).where(eq(watermarkSettings.businessId, business.id));
      branding = b || null;
      signature = s || null;
      watermark = w || null;
    }

    return res.status(200).json({ profile, business, branding, signature, watermark });
  }

  if (req.method === 'PUT') {
    const { section, data } = req.body;

    if (section === 'profile') {
      const [updated] = await db.update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, user.id))
        .returning();
      return res.status(200).json(updated);
    }

    if (section === 'business') {
      const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
      if (!business) return res.status(404).json({ error: 'Business not found' });
      
      const [updated] = await db.update(businesses)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(businesses.id, business.id))
        .returning();
      return res.status(200).json(updated);
    }

    if (section === 'branding') {
      const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
      if (!business) return res.status(404).json({ error: 'Business not found' });
      
      const [existing] = await db.select().from(brandingSettings).where(eq(brandingSettings.businessId, business.id));
      if (existing) {
        const [updated] = await db.update(brandingSettings)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(brandingSettings.id, existing.id))
          .returning();
        return res.status(200).json(updated);
      } else {
        const [created] = await db.insert(brandingSettings)
          .values({ ...data, businessId: business.id })
          .returning();
        return res.status(201).json(created);
      }
    }

    return res.status(400).json({ error: 'Invalid section' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
