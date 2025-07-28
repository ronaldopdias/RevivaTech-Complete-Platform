import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"

/**
 * Professional authentication middleware for RevivaTech
 * Enterprise-grade route protection and session management
 */

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  // Define route patterns
  const isAdminRoute = nextUrl.pathname.startsWith('/admin')
  const isTechnicianRoute = nextUrl.pathname.startsWith('/technician')
  const isAuthRoute = nextUrl.pathname.startsWith('/auth')
  const isPublicRoute = [
    '/',
    '/about',
    '/services',
    '/contact',
    '/pricing',
    '/apple',
    '/laptop-pc',
    '/consoles',
    '/data-recovery',
    '/reviews',
    '/testimonials',
    '/faq',
    '/terms',
    '/privacy',
    '/careers',
    '/warranty'
  ].includes(nextUrl.pathname) || nextUrl.pathname.startsWith('/api/')

  // Professional authentication logic
  
  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    const redirectUrl = getUserDashboard(userRole)
    return NextResponse.redirect(new URL(redirectUrl, nextUrl))
  }

  // Protect admin routes
  if (isAdminRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', nextUrl)
      loginUrl.searchParams.set('returnUrl', nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (!isAdminOrSuperAdmin(userRole)) {
      return NextResponse.redirect(new URL('/auth/unauthorized', nextUrl))
    }
  }

  // Protect technician routes
  if (isTechnicianRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', nextUrl)
      loginUrl.searchParams.set('returnUrl', nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (!isTechnicianOrAbove(userRole)) {
      return NextResponse.redirect(new URL('/auth/unauthorized', nextUrl))
    }
  }

  // Protect dashboard and other authenticated routes
  const protectedRoutes = ['/dashboard', '/profile', '/booking', '/customer-portal']
  if (protectedRoutes.some(route => nextUrl.pathname.startsWith(route))) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', nextUrl)
      loginUrl.searchParams.set('returnUrl', nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
})

/**
 * Professional role checking utilities
 */
function isAdminOrSuperAdmin(role?: string): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

function isTechnicianOrAbove(role?: string): boolean {
  return role === 'TECHNICIAN' || role === 'ADMIN' || role === 'SUPER_ADMIN'
}

function getUserDashboard(role?: string): string {
  switch (role) {
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/admin'
    case 'TECHNICIAN':
      return '/technician'
    default:
      return '/dashboard'
  }
}

/**
 * Professional middleware configuration
 * Matches all routes except static files and API routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js internal routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
}