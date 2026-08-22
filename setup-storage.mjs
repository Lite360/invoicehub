import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setup() {
  console.log('Creating public "uploads" bucket in Supabase Storage...');

  const { data, error } = await supabase.storage.createBucket('uploads', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'],
  });

  if (error) {
    if (error.message?.includes('already exists')) {
      console.log('✅ Bucket "uploads" already exists.');
    } else {
      console.error('❌ Error:', error.message);
    }
  } else {
    console.log('✅ Bucket "uploads" created successfully!', data);
  }
}

setup();
