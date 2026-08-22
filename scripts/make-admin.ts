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
    console.log(`Looking up user in auth.users: ${email}`);
    
    // 1. Find user in auth.users first (source of truth)
    const [authUser] = await client`SELECT id, email FROM auth.users WHERE email = ${email}`;
    
    if (!authUser) {
      throw new Error(`User not found in auth.users! Make sure you have registered with email: ${email}`);
    }
    
    console.log(`Found auth user: ${authUser.id}`);
    
    // 2. Ensure user exists in public.users (create if missing)
    let [user] = await db.select().from(schema.users).where(eq(schema.users.id, authUser.id));
    if (!user) {
      console.log('Creating public.users record...');
      [user] = await db.insert(schema.users).values({
        id: authUser.id,
        email: authUser.email,
        fullName: 'Admin',
      }).returning();
      console.log('Created public.users record.');
    }

    // 3. Ensure super_admin role exists
    console.log('Ensuring super_admin role exists...');
    await db.insert(schema.roles).values({
      id: 'super_admin',
      name: 'Super Admin',
      description: 'Has full access to everything in the admin panel',
    }).onConflictDoNothing();

    // 4. Assign role to user
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
