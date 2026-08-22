import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// Use pooling URL for serverless (Vercel) — pgbouncer on port 6543.
// Falls back to DATABASE_URL for local dev / drizzle-kit migrations.
const connectionString = process.env.DATABASE_POOLING_URL || process.env.DATABASE_URL || '';

const queryClient = postgres(connectionString, {
  max: 1,            // 1 connection per serverless invocation
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,    // REQUIRED for pgbouncer — disables prepared statements
});

export const db = drizzle(queryClient, { schema });
