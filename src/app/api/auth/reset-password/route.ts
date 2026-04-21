import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, revokeAllUserTokens } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { email, otp, new_password } = await request.json()

    if (!email || !otp || !new_password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (new_password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Verify OTP
    const store = global.__gt_otps__
    const record = store?.get(email.toLowerCase())

    if (!record || record.otp !== otp || Date.now() > record.expires) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Find user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Hash new password
    const password_hash = await hashPassword(new_password)

    // Update password
    await supabaseAdmin
      .from('users')
      .update({ password_hash })
      .eq('id', user.id)

    // Delete OTP
    store?.delete(email.toLowerCase())

    // Revoke all sessions
    await revokeAllUserTokens(user.id)

    return NextResponse.json({
      message: 'Password reset successfully. Please log in.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}