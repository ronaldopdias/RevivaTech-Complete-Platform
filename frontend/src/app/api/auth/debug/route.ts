import { NextRequest, NextResponse } from 'next/server'
import { authLogger } from '@/lib/auth/logger'
import { auth } from '@/lib/auth/better-auth-server'

/**
 * Better Auth Debug Endpoint
 * Provides authentication debugging information for development
 */
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Debug endpoint only available in development' }, { status: 403 })
  }

  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userEmail = searchParams.get('email')
    const count = parseInt(searchParams.get('count') || '50')

    switch (action) {
      case 'logs':
        return NextResponse.json({
          logs: authLogger.getRecentLogs(count),
          totalLogs: authLogger.getRecentLogs(1000).length
        })

      case 'user-logs':
        if (!userEmail) {
          return NextResponse.json({ error: 'Email parameter required for user-logs' }, { status: 400 })
        }
        return NextResponse.json({
          logs: authLogger.getUserLogs(userEmail, count),
          userEmail
        })

      case 'errors':
        return NextResponse.json({
          errors: authLogger.getErrorLogs(count)
        })

      case 'session':
        return NextResponse.json({
          session,
          hasSession: !!session,
          user: session?.user || null
        })

      case 'clear':
        authLogger.clearLogs()
        return NextResponse.json({ message: 'Logs cleared' })

      default:
        return NextResponse.json({
          availableActions: ['logs', 'user-logs', 'errors', 'session', 'clear'],
          usage: {
            logs: '/api/auth/debug?action=logs&count=50',
            userLogs: '/api/auth/debug?action=user-logs&email=user@example.com&count=20',
            errors: '/api/auth/debug?action=errors&count=20',
            session: '/api/auth/debug?action=session',
            clear: '/api/auth/debug?action=clear'
          }
        })
    }
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug endpoint error', 
      details: error instanceof Error ? error.message : error 
    }, { status: 500 })
  }
}