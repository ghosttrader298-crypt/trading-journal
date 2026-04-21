import { NextResponse } from 'next/server'
import { getUserFromRequest } from './auth'
import { supabaseAdmin } from './supabase'
import { JWTPayload } from '@/types'

type RouteHandler = (
  req: Request,
  context: { params: any },
  user: JWTPayload
) => Promise<NextResponse>

// Require authenticated user
export function requireUser(handler: RouteHandler) {
  return async (req: Request, context: { params: any }) => {
    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check user is still active
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('status')
      .eq('id', user.sub)
      .single()

    if (!dbUser || dbUser.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Account suspended' },
        { status: 403 }
      )
    }

    return handler(req, context, user)
  }
}

// Require admin role
export function requireAdmin(handler: RouteHandler) {
  return async (req: Request, context: { params: any }) => {
    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'VIEW_ONLY_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    return handler(req, context, user)
  }
}

// Require super admin role
export function requireSuperAdmin(handler: RouteHandler) {
  return async (req: Request, context: { params: any }) => {
    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      )
    }

    return handler(req, context, user)
  }
}

// Forbidden helper
export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}