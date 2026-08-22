import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: false,
  },
};

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

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.error('BLOB_READ_WRITE_TOKEN is not set');
      return response.status(500).json({ error: 'Upload failed', details: 'Storage token not configured' });
    }

    const contentType = (request.headers['content-type'] as string) || 'application/octet-stream';
    const rawFilename = (request.headers['x-vercel-filename'] as string) || `upload-${Date.now()}`;
    // Ensure filename has an extension based on content type
    const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
    const filename = rawFilename.includes('.') ? rawFilename : `${rawFilename}.${ext}`;

    console.log(`[upload] Receiving: ${filename} (${contentType})`);

    // Read raw body as buffer using traditional events to avoid Windows Vercel dev stream crashes
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

    const blob = await put(filename, buffer, {
      access: 'public',
      contentType,
      token,
    });

    console.log(`[upload] Success: ${blob.url}`);
    return response.status(200).json(blob);
  } catch (error: any) {
    console.error('Upload handler error:', error);
    return response.status(500).json({
      error: 'Upload failed',
      details: error.message || 'Unknown error',
    });
  }
}
