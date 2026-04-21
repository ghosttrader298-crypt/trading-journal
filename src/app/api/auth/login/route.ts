import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyPassword, createToken, toSafeUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please enter your email and password' },
        { status: 400 }
      )
    }

    // Find user by email
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 401 }
      )
    }

    // Check account status
    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Your account has been suspended. Contact support.' },
        { status: 403 }
      )
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password_hash)
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      )
    }

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    // Create token
    const token = await createToken(user.id, user.email, user.role)

    // Determine redirect
    const redirectTo =
      user.role === 'USER' ? '/dashboard' : '/admin/dashboard'

    const safeUser = toSafeUser(user)

    const response = NextResponse.json({
      data: safeUser,
      message: 'Login successful',
      redirectTo,
    })

    // Set cookie
    response.cookies.set('gt_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}