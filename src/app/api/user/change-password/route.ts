import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyPassword, hashPassword } from '@/lib/auth'
import { JWTPayload } from '@/types'

export const POST = requireUser(async (req, _ctx, user: JWTPayload) => {
  const { current_password, new_password } = await req.json()

  if (!current_password || !new_password) {
    return NextResponse.json(
      { error: 'Current and new password are required' },
      { status: 400 }
    )
  }

  if (new_password.length < 8) {
    return NextResponse.json(
      { error: 'New password must be at least 8 characters' },
      { status: 400 }
    )
  }

  // Get current password hash
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('password_hash')
    .eq('id', user.sub)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const valid = await verifyPassword(current_password, userData.password_hash)
  if (!valid) {
    return NextResponse.json(
      { error: 'Current password is incorrect' },
      { status: 400 }
    )
  }

  const password_hash = await hashPassword(new_password)

  await supabaseAdmin
    .from('users')
    .update({ password_hash })
    .eq('id', user.sub)

  return NextResponse.json({ message: 'Password changed successfully' })
})