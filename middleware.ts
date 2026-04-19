import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const protectedRoutes = ['/', '/goals', '/analytics', '/calendar', '/history', '/settings'];
  const pathname = request.nextUrl.pathname;

  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const hasSessionCookie = Boolean(request.cookies.get('sb-access-token'));

  if (isProtected && !hasSessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/goals/:path*', '/analytics/:path*', '/calendar/:path*', '/history/:path*', '/settings/:path*'],
};