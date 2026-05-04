import { NextResponse } from 'next/server'
import { getUserFromRequest } from './auth'
import { supabaseAdmin } from './supabase'
import { JWTPayload } from '@/types'

type RouteHandler = (
  req: Request,
  context: { params: Promise<any> },
  user: JWTPayload
) => Promise<NextResponse>

export function requireUser(handler: RouteHandler) {
  return async (req: Request, context: { params: Promise<any> }) => {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('status')
      .eq('id', user.sub)
      .single()
    if (!dbUser || dbUser.status === 'SUSPENDED') {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
    }
    return handler(req, context, user)
  }
}

export function requireAdmin(handler: RouteHandler) {
  return async (req: Request, context: { params: Promise<any> }) => {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'VIEW_ONLY_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }
    return handler(req, context, user)
  }
}

export function requireSuperAdmin(handler: RouteHandler) {
  return async (req: Request, context: { params: Promise<any> }) => {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 })
    }
    return handler(req, context, user)
  }
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}