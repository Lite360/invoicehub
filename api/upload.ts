import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const BUCKET = 'uploads';

export default async function uploadHandler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-vercel-filename');
  if (request.method === 'OPTIONS') return response.status(200).end();

  try {
    if (request.method !== 'POST') {
      return response.status(405).json({ error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Supabase env vars missing');
      return response.status(500).json({ error: 'Upload failed', details: 'Storage not configured' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const contentType = (request.headers['content-type'] as string) || 'application/octet-stream';
    const rawFilename = (request.headers['x-vercel-filename'] as string) || `upload-${Date.now()}`;
    const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
    const filename = rawFilename.includes('.') ? rawFilename : `${rawFilename}.${ext}`;
    const path = `${Date.now()}-${filename}`;

    console.log(`[upload] Receiving: ${filename} (${contentType})`);

    // Read raw body as buffer
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      request.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      request.on('end', () => resolve(Buffer.concat(chunks)));
      request.on('error', reject);
    });

    if (buffer.length === 0) {
      return response.status(400).json({ error: 'Empty file received' });
    }

    console.log(`[upload] Buffer size: ${buffer.length} bytes`);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('[upload] Supabase storage error:', error.message);
      return response.status(500).json({ error: 'Upload failed', details: error.message });
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    console.log(`[upload] Success: ${publicUrl}`);

    // Return in same shape as Vercel Blob for frontend compatibility
    return response.status(200).json({ url: publicUrl, pathname: path });
  } catch (error: any) {
    console.error('Upload handler error:', error);
    return response.status(500).json({
      error: 'Upload failed',
      details: error.message || 'Unknown error',
    });
  }
}
