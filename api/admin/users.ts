import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db';
import { users, businesses, userRoles } from '../../src/db/schema';
import { eq, like, desc, sql } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function getAdminUser(req: VercelRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;
  const [role] = await db.select().from(userRoles).where(eq(userRoles.userId, user.id));
  return role ? user : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await getAdminUser(req);
  if (!admin) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    let query = db.select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      phoneNumber: users.phoneNumber,
      createdAt: users.createdAt,
      businessName: businesses.name,
      businessId: businesses.id,
    })
    .from(users)
    .leftJoin(businesses, eq(businesses.ownerId, users.id))
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

    const allUsers = await query;
    return res.status(200).json({ users: allUsers, page, limit });
  }

  // POST — update user status (suspend / activate)
  if (req.method === 'POST') {
    const { userId, action } = req.body;
    if (!userId || !action) return res.status(400).json({ error: 'userId and action required' });
    // For suspension we'd disable the Supabase auth user via admin API
    // This requires service role key — note it in settings
    return res.status(200).json({ success: true, note: 'User management requires service role key configured in admin settings' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
