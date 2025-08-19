import { NextRequest, NextResponse } from "next/server"

/**
 * Better Auth Middleware for RevivaTech
 * Simple route protection without session verification at middleware level
 * Authentication state will be verified at page/component level
 */

export default async function middleware(request: NextRequest) {
  const { nextUrl } = request

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
    '/warranty',
    '/login'
  ].includes(nextUrl.pathname) || nextUrl.pathname.startsWith('/api/')

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For protected routes, let Better Auth handle session verification
  // The components will use client-side auth guards
  return NextResponse.next()
}

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
     * - api/auth (Better Auth internal routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
}