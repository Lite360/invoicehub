import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env') });
const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    console.log("Testing businesses/me simulation...");
    const ownerId = '6f5d7ac6-2a3f-475f-9507-6c1ccd50ec6c';

    console.log("1. Get role");
    const roleObj = await sql`SELECT * FROM user_roles WHERE user_id = ${ownerId}`;
    console.log(roleObj);

    console.log("2. Get business");
    const business = await sql`SELECT * FROM businesses WHERE owner_id = ${ownerId}`;
    console.log(business);
    
    if (business.length > 0) {
      const bId = business[0].id;
      console.log("3. Get branding for", bId);
      const branding = await sql`SELECT * FROM branding_settings WHERE business_id = ${bId}`;
      console.log(branding);
    }
  } catch (error) {
    console.error("DB Error:", error);
  } finally {
    await sql.end();
  }
}

main();
