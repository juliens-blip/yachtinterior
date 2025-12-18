'use client';

import { createBrowserClient } from '@supabase/ssr';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseUrl = rawUrl?.replace(/\/+$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.');
}

if (!supabaseUrl.includes('.supabase.co')) {
  throw new Error(`Invalid Supabase URL detected: "${supabaseUrl}". It should include ".supabase.co".`);
}

// Use @supabase/ssr for browser client to ensure cookies are used (not localStorage)
// This ensures the middleware can read the session from cookies
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
