'use client';

import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseUrl = rawUrl?.replace(/\/+$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.');
}

if (!supabaseUrl.includes('.supabase.co')) {
  throw new Error(`Invalid Supabase URL detected: "${supabaseUrl}". It should include ".supabase.co".`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
