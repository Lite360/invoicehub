import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../src/lib/supabase'; // We'll need a backend client for token auth if we restrict

export default async function uploadHandler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const body = (request.body as HandleUploadBody);

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Authenticate the user here
        // For MVP we allow token generation, but ideally verify Supabase JWT in Authorization header
        const authHeader = request.headers.authorization;
        if (!authHeader) {
           throw new Error('Unauthorized');
        }

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Optional callback after upload completes
        console.log('blob upload completed', blob, tokenPayload);
      },
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    return response.status(400).json({ error: (error as Error).message });
  }
}
