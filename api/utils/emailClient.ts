import { Resend } from 'resend';

/**
 * Initialize the Resend client using the RESEND_API_KEY environment variable.
 */
export function getResendClient(_userId?: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set.');
  }

  return new Resend(apiKey);
}
