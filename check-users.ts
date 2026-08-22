import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env') });
const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  const users = await sql`SELECT id, email, created_at FROM users`;
  console.log("Users in public.users:", users);
  
  const authUsers = await sql`SELECT id, email FROM auth.users`;
  console.log("Users in auth.users:", authUsers);
  
  await sql.end();
}

main().catch(console.error);
