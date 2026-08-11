import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/db';
import { invoices, quotations, receipts, letters, businesses } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';
import { put } from '@vercel/blob';
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const [business] = await db.select().from(businesses).where(eq(businesses.ownerId, user.id));
    if (!business) return res.status(404).json({ error: 'Business not found' });

    const { docId, docType, pdfBase64, filename } = req.body;
    
    if (!docId || !docType || !pdfBase64) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert base64 to buffer
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload to Vercel Blob
    const blob = await put(`documents/${docType}/${filename || `${docId}.pdf`}`, buffer, {
      access: 'public',
      contentType: 'application/pdf',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const pdfUrl = blob.url;

    // Update DB record
    let table: any;
    switch (docType) {
      case 'invoice': table = invoices; break;
      case 'quotation': table = quotations; break;
      case 'receipt': table = receipts; break;
      case 'letter': table = letters; break;
      default: return res.status(400).json({ error: 'Invalid document type' });
    }

    await db.update(table)
      .set({ pdfUrl, updatedAt: new Date() })
      .where(and(eq(table.id, docId), eq(table.businessId, business.id)));

    return res.status(200).json({ success: true, url: pdfUrl });
  } catch (error: any) {
    console.error('PDF Upload Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
