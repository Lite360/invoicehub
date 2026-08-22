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
  try {
    if (request.method !== 'POST') {
      return response.status(405).json({ error: 'Method not allowed' });
    }

    const contentType = request.headers['content-type'] || 'application/octet-stream';
    const filename = (request.headers['x-vercel-filename'] as string) || `upload-${Date.now()}`;

    // Read raw body as buffer using traditional events to avoid Windows Vercel dev stream crashes
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      request.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      request.on('end', () => resolve(Buffer.concat(chunks)));
      request.on('error', reject);
    });

    if (buffer.length === 0) {
      return response.status(400).json({ error: 'Empty file' });
    }

    const blob = await put(filename, buffer, {
      access: 'public',
      contentType,
    });

    return response.status(200).json(blob);
  } catch (error) {
    console.error('Upload handler error:', error);
    return response.status(500).json({
      error: 'Upload failed',
      details: (error as Error).message,
    });
  }
}
