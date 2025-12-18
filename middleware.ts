// Middleware désactivé pour éviter tout blocage d'auth côté serveur.
// La protection d'accès repose côté client et dans les API.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return NextResponse.next({
    request: { headers: request.headers },
  });
}

// Garder les mêmes matchers pour pouvoir réactiver facilement si besoin.
export const config = {
  matcher: ['/', '/api/generate'],
};
