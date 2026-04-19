import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Additional middleware logic can be added here later
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/', '/goals/:path*', '/analytics/:path*', '/calendar/:path*', '/history/:path*', '/settings/:path*'],
};