import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const PROTECTED_PATHS = ['/', '/api/generate'];

// Helper: check that the incoming host matches NEXT_PUBLIC_APP_URL to avoid preview mis-matches.
function isPrimaryHost(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return false;
  try {
    const expectedHost = new URL(appUrl).host;
    return request.nextUrl.host === expectedHost;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  // If not a protected path, or host doesn't match the primary app URL, let it through.
  if (!isProtected || !isPrimaryHost(request)) {
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Supabase server client using SSR helpers to keep cookies in sync.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Basic auth gate: require a logged-in user; subscription checks are handled in API/client to avoid redirect loops.
  const { data: userResult, error } = await supabase.auth.getUser();
  if (error || !userResult?.user) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/', '/api/generate'],
};
