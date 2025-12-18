import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protection de la landing page "/"
  if (request.nextUrl.pathname === '/') {
    if (!user) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    // Check subscription status
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subError) {
      console.warn('[MIDDLEWARE] Subscription lookup error, allowing through:', subError.message);
      return response;
    }

    const now = new Date();
    const hasActiveSubscription =
      subscription?.status === 'active' ||
      subscription?.status === 'trialing' ||
      (subscription?.status === 'canceled' &&
       subscription?.current_period_end &&
       new Date(subscription.current_period_end) > now) ||
      (subscription?.status === 'past_due' &&
       subscription?.current_period_end &&
       new Date(subscription.current_period_end) > now);

    if (!hasActiveSubscription) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/', '/api/generate'],
};
