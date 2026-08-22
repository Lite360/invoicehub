import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env') });
const sql = postgres(process.env.DATABASE_URL);

async function main() {
  const users = await sql`SELECT * FROM users`;
  console.log("Users:", users);
  
  const authUsers = await sql`SELECT id, email FROM auth.users`;
  console.log("Auth Users:", authUsers);
  
  const businesses = await sql`SELECT * FROM businesses`;
  console.log("Businesses:", businesses);

  const branding = await sql`SELECT * FROM branding_settings`;
  console.log("Branding:", branding);

  await sql.end();
}

main().catch(console.error);
