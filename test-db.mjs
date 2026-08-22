import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './src/db/schema.js';
import { eq } from 'drizzle-orm';

const queryClient = postgres(process.env.DATABASE_URL || '');
const db = drizzle(queryClient, { schema });

async function run() {
  try {
    // Generate a mock user ID
    const userId = '11111111-1111-1111-1111-111111111111';

    await db.transaction(async (tx) => {
      // Ensure user exists
      const [existingUser] = await tx.select().from(schema.users).where(eq(schema.users.id, userId));
      if (!existingUser) {
        await tx.insert(schema.users).values({
          id: userId,
          email: 'test@example.com',
          fullName: 'Test User',
          phoneNumber: null,
        });
      }

      // Insert business
      const [newBusiness] = await tx.insert(schema.businesses).values({
        ownerId: userId,
        name: 'Test Business',
        type: 'Software',
        email: 'business@example.com',
        phone: '1234567890',
        address: '123 Test St',
        website: '',
        registrationNumber: '',
        taxId: '',
        currency: 'NGN',
      }).returning();
      console.log('Business inserted:', newBusiness.id);

      await tx.insert(schema.brandingSettings).values({ businessId: newBusiness.id, logoUrl: '', primaryColor: '#000', secondaryColor: '#000', accentColor: '#000', backgroundColor: '#fff', textColor: '#000', defaultTemplate: 'modern' });
      console.log('Branding inserted');

      await tx.insert(schema.signatureSettings).values({ businessId: newBusiness.id, signatureType: 'upload', signatureText: '', signatureUrl: '' });
      console.log('Signature inserted');

      await tx.insert(schema.watermarkSettings).values({ businessId: newBusiness.id, enabled: false, type: 'text', text: '', opacity: 10, position: 'center', rotation: -45 });
      console.log('Watermark inserted');
    });

    console.log('Transaction completed successfully!');
  } catch (error) {
    console.error('TRANSACTION ERROR:', error);
  } finally {
    process.exit(0);
  }
}
run();
