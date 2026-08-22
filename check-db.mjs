import 'dotenv/config';
import { db } from './src/db/index.js';
import { users, businesses } from './src/db/schema.js';

async function run() {
  const allUsers = await db.select().from(users);
  console.log('Users in DB:', allUsers.length);
  const allBusinesses = await db.select().from(businesses);
  console.log('Businesses in DB:', allBusinesses.length);
  process.exit(0);
}
run();
