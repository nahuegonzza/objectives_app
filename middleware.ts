import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
let res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => req.cookies.get(key)?.value,
        set: (key, value, options) => {
          res.cookies.set({ name: key, value, ...options });
        },
        remove: (key) => {
          res.cookies.set({ name: key, value: '', maxAge: 0 });
        },
      },
    }
  )

  const protectedRoutes = ['/', '/goals', '/analytics', '/calendar', '/history', '/settings']
  const pathname = req.nextUrl.pathname

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/', '/goals/:path*', '/analytics/:path*', '/calendar/:path*', '/history/:path*', '/settings/:path*'],
}