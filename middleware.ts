import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public routes that must NEVER be guarded or redirected to login
 */
const PUBLIC_ROUTES = [
  '/auction',
  '/auction/ended',
  '/players',
  '/teams',
  '/gallery',
  '/highlights',
  '/',
  '/api/auction',
  '/api/players',
  '/api/teams',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Explicitly allow public live viewer route
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
