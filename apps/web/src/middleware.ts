import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * CareerAI Copilot — Route Protection Middleware
 *
 * - All /dashboard/* routes require a valid next-auth session token
 * - Public routes are allowed through without authentication
 * - API auth routes are always accessible (for login/callback flows)
 */

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/onboarding',
]

function isPublicPath(pathname: string): boolean {
  // Exact match public pages
  if (PUBLIC_PATHS.includes(pathname)) return true

  // Allow all next-auth API routes
  if (pathname.startsWith('/api/auth')) return true

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return true
  }

  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Check for session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // If no valid token and trying to access protected route, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    // Preserve the original URL as a callback so we can redirect back after login
    loginUrl.searchParams.set('callbackUrl', encodeURI(pathname))
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files with extensions (.svg, .png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
