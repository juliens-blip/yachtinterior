import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const PROTECTED_PATHS = ['/', '/api/generate'];

const hasGraceParam = (url: URL) =>
  url.searchParams.has('success') || url.searchParams.has('session_id');

const hasActiveStatus = (status?: string, currentPeriodEnd?: string | null) => {
  if (!status) return false;
  if (status === 'active' || status === 'trialing') return true;

  const now = new Date();
  if (
    status === 'past_due' &&
    currentPeriodEnd &&
    new Date(currentPeriodEnd) > now
  ) {
    return true;
  }

  if (
    status === 'canceled' &&
    currentPeriodEnd &&
    new Date(currentPeriodEnd) > now
  ) {
    return true;
  }

  return false;
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  // Skip middleware for unprotected paths
  if (!isProtected) {
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
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

  // 1) Récupérer l'utilisateur
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  const user = userResult?.user;

  // Si pas d'utilisateur et qu'on est sur une route protégée -> redirect /auth
  if (userError || !user) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // 2) Récupérer la subscription (ne bloque pas en cas d'erreur)
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle();

  // Si on ne trouve rien ou erreur, laisser passer si on revient de Stripe (success/session_id)
  if (subError || !subscription) {
    if (hasGraceParam(request.nextUrl)) {
      return response;
    }
    // Laisser passer mais log minimal côté serveur (pas de console ici)
    return response;
  }

  // 3) Vérifier le statut
  const isActive = hasActiveStatus(
    subscription.status,
    subscription.current_period_end
  );

  if (!isActive) {
    // Si retour Stripe (success/session_id), laisser passer pour éviter la boucle
    if (hasGraceParam(request.nextUrl)) {
      return response;
    }
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/', '/api/generate'],
};
