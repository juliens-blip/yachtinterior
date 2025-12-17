import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    // Create server-side Supabase client for auth callback
    const supabase = await createClient();

    // Exchange code for session
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to home page after confirmation
  return NextResponse.redirect(new URL('/', request.url));
}
