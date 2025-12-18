import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Routes complètement publiques - accessible sans authentification
const PUBLIC_PATHS = [
  '/auth',
  '/auth/callback',
  '/api/webhooks/stripe',
  '/api/create-checkout-session',
];

// Routes protégées - nécessitent une authentification
const PROTECTED_PATHS = ['/', '/api/generate'];

// Debug mode (activé via NEXT_PUBLIC_DEBUG=true)
const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

function log(...args: unknown[]) {
  if (DEBUG) {
    console.log('[Middleware]', ...args);
  }
}

// Helper: check if path is public (no auth required)
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

// Helper: check if path is protected (auth required)
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  log('Request:', pathname);

  // 1. Allow public paths without any checks
  if (isPublicPath(pathname)) {
    log('Public path, allowing access');
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }

  // 2. Allow non-protected paths without checks
  if (!isProtectedPath(pathname)) {
    log('Non-protected path, allowing access');
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }

  // 3. Protected path - verify authentication
  log('Protected path, checking auth');

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Create Supabase server client with SSR cookie handling
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

  // Check authentication (NOT subscription - to avoid redirect loops)
  const { data: userResult, error } = await supabase.auth.getUser();

  if (error || !userResult?.user) {
    log('No authenticated user, redirecting to /auth');
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  log('Authenticated user:', userResult.user.id);
  return response;
}

export const config = {
  // Match all paths except static files and API webhooks
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
