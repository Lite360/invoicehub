import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function uploadHandler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const body = (request.body as HandleUploadBody);
  console.log('--- UPLOAD REQUEST ---');
  console.log('Headers:', request.headers);
  console.log('Body:', body);

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Accept auth from either Authorization header or clientPayload
        const token = request.headers.authorization || clientPayload;
        if (!token) {
           throw new Error('Unauthorized');
        }

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('blob upload completed', blob, tokenPayload);
      },
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    return response.status(400).json({ error: (error as Error).message });
  }
}
