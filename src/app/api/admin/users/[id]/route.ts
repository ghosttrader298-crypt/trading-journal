import { NextResponse } from 'next/server'
import { requireAdmin, requireSuperAdmin } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'
import { JWTPayload } from '@/types'

export const PATCH = requireAdmin(async (req, ctx, user: JWTPayload) => {
  const { id } = await ctx.params
  const body = await req.json()
  const { action } = body

  if (id === user.sub) {
    return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 })
  }

  if (action === 'suspend') {
    await supabaseAdmin.from('users').update({ status: 'SUSPENDED' }).eq('id', id)
    return NextResponse.json({ message: 'User suspended' })
  }

  if (action === 'unsuspend') {
    await supabaseAdmin.from('users').update({ status: 'ACTIVE' }).eq('id', id)
    return NextResponse.json({ message: 'User reactivated' })
  }

  if (action === 'reset_password') {
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'
    const password_hash = await hashPassword(tempPassword)
    await supabaseAdmin.from('users').update({ password_hash }).eq('id', id)
    return NextResponse.json({ message: 'Password reset', temp_password: tempPassword })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
})

export const DELETE = requireSuperAdmin(async (req, ctx, user: JWTPayload) => {
  const { id } = await ctx.params

  if (id === user.sub) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  await supabaseAdmin.from('users').delete().eq('id', id)
  return NextResponse.json({ message: 'User deleted' })
})