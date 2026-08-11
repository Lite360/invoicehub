import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { businesses, brandingSettings, signatureSettings, watermarkSettings } from '../../src/db/schema';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verify Authentication
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Parse Request Body
  const { businessInfo, logoUrl, brandColors, defaultTemplate, signature, watermark } = request.body;

  try {
    // 3. Database Transaction
    await db.transaction(async (tx) => {
      // Create Business
      const [newBusiness] = await tx.insert(businesses).values({
        ownerId: user.id,
        name: businessInfo.name,
        type: businessInfo.type,
        email: businessInfo.email,
        phone: businessInfo.phone,
        address: businessInfo.address,
        website: businessInfo.website,
        registrationNumber: businessInfo.registrationNumber,
        taxId: businessInfo.taxId,
        currency: businessInfo.currency,
      }).returning();

      // Create Branding Settings
      await tx.insert(brandingSettings).values({
        businessId: newBusiness.id,
        logoUrl: logoUrl,
        primaryColor: brandColors.primary,
        secondaryColor: brandColors.secondary,
        accentColor: brandColors.accent,
        backgroundColor: brandColors.background,
        textColor: brandColors.text,
        defaultTemplate: defaultTemplate,
      });

      // Create Signature Settings
      await tx.insert(signatureSettings).values({
        businessId: newBusiness.id,
        signatureType: signature.type, // 'type' or 'upload'
        signatureText: signature.text,
        signatureUrl: signature.url,
      });

      // Create Watermark Settings
      await tx.insert(watermarkSettings).values({
        businessId: newBusiness.id,
        enabled: watermark.enabled,
        type: watermark.type, // 'text' or 'logo'
        text: watermark.text,
        opacity: watermark.opacity,
        position: watermark.position,
        rotation: watermark.rotation,
      });
    });

    return response.status(200).json({ success: true, message: 'Company setup complete.' });
  } catch (error) {
    console.error('Setup error:', error);
    return response.status(500).json({ error: 'Internal server error during setup.' });
  }
}
