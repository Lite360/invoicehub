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

    const contentType = request.headers['content-type'] || '';
    const filename = (request.headers['x-vercel-filename'] as string) || `upload-${Date.now()}`;

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.some(t => contentType.startsWith(t))) {
      return response.status(400).json({ error: 'Invalid file type' });
    }

    // Read raw body as buffer
    const chunks: Buffer[] = [];
    for await (const chunk of request) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length === 0) {
      return response.status(400).json({ error: 'Empty file' });
    }

    const blob = await put(filename, buffer, {
      access: 'private',
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
