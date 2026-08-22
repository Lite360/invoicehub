import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';

// Load .env
config({ path: resolve(process.cwd(), '.env') });

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function makeAdmin(email: string) {
  try {
    console.log(`Checking user with email: ${email}`);
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    
    if (!user) {
      throw new Error('User not found! Please register this email in the app first.');
    }

    // Ensure super_admin role exists
    console.log('Ensuring super_admin role exists...');
    await db.insert(schema.roles).values({
      id: 'super_admin',
      name: 'Super Admin',
      description: 'Has full access to everything in the admin panel',
    }).onConflictDoNothing();

    // Assign role to user
    console.log(`Assigning super_admin role to user ID: ${user.id}`);
    await db.insert(schema.userRoles).values({
      userId: user.id,
      roleId: 'super_admin',
    }).onConflictDoNothing();

    console.log('✅ Success! The user is now a Super Admin.');
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

const emailToElevate = process.argv[2];

if (!emailToElevate) {
  console.log('Please provide an email address. Usage: npx tsx scripts/make-admin.ts <email>');
  process.exit(1);
}

makeAdmin(emailToElevate);
