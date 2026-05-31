/**
 * middleware.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Next.js Edge Middleware — runs before every matched request.
 *
 * Rules:
 *   - /login          → always accessible (public)
 *   - /api/login      → always accessible (public)
 *   - /api/logout     → always accessible (public)
 *   - everything else → requires valid session cookie
 *
 * If no valid session:
 *   - Page requests  → redirect to /login
 *   - API requests   → return 401 JSON
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/auth'

// Routes that do NOT require authentication
const PUBLIC_PATHS = ['/login', '/api/login', '/api/logout']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths through immediately
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow Next.js internals (_next/static, _next/image, favicon, etc.)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|css|js|woff2?)$/)
  ) {
    return NextResponse.next()
  }

  // Check for session cookie
  const token = req.cookies.get('nosteq_session')?.value
  console.log('[v0] Middleware - path:', pathname, 'has token:', !!token)

  if (!token) {
    console.log('[v0] Middleware - no token found, redirecting')
    return redirectOrReject(req)
  }

  // Verify the JWT is valid and not expired
  const session = await verifySessionToken(token)
  console.log('[v0] Middleware - session verified:', !!session)

  if (!session) {
    console.log('[v0] Middleware - session verification failed, redirecting')
    return redirectOrReject(req)
  }

  // Valid session — pass through
  console.log('[v0] Middleware - valid session, allowing through')
  return NextResponse.next()
}

function redirectOrReject(req: NextRequest) {
  const { pathname } = req.nextUrl

  // API routes get a 401 JSON response
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Not authenticated. Please log in.' },
      { status: 401 }
    )
  }

  // Page routes get redirected to /login
  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  // Run middleware on all routes except Next.js internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
