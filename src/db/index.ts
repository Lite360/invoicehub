import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// Use pooling URL for serverless (Vercel) to avoid connection exhaustion.
// DATABASE_POOLING_URL uses pgbouncer on port 6543.
// Falls back to DATABASE_URL for local dev / migrations.
const connectionString = process.env.DATABASE_POOLING_URL || process.env.DATABASE_URL || '';

const queryClient = postgres(connectionString, {
  max: 1,          // Limit to 1 connection per serverless invocation
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });
