import { getToken } from '@vercel/connect';
import { Resend } from 'resend';

/**
 * Helper to securely get the Resend API token using @vercel/connect
 * and initialize the Resend client.
 */
export async function getResendClient(userId: string) {
  try {
    const tokenResponse = await getToken('api.resend.com/invoicehub', {
      subject: { type: 'user', id: userId },
      scopes: ['full_access', 'emails:send'],
    });
    
    // getToken returns a string directly
    const apiKey = tokenResponse || process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      throw new Error('Resend API key not found via Vercel Connect or environment variables.');
    }

    return new Resend(apiKey);
  } catch (error) {
    console.error('Error fetching Resend token via Vercel Connect:', error);
    
    // Fallback to static env variable for local development if @vercel/connect fails
    if (process.env.RESEND_API_KEY) {
      return new Resend(process.env.RESEND_API_KEY);
    }
    
    throw error;
  }
}
