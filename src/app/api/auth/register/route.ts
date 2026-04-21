import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, createToken, toSafeUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Password strength check
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const password_hash = await hashPassword(password)

    // Create user
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        role: 'USER',
        status: 'ACTIVE',
        display_name: email.split('@')[0],
      })
      .select()
      .single()

    if (createError || !newUser) {
      console.error('Create user error:', createError)
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    // Create default trading account
    await supabaseAdmin.from('trading_accounts').insert({
      user_id: newUser.id,
      name: 'My Live Account',
      account_type: 'LIVE',
      currency: 'USD',
      initial_balance: 0,
      current_balance: 0,
      is_default: true,
    })

    // Create onboarding state
    await supabaseAdmin.from('onboarding_states').insert({
      user_id: newUser.id,
      step: 1,
      completed_steps: [],
      is_completed: false,
    })

    // Create notification preferences
    await supabaseAdmin.from('notification_preferences').insert({
      user_id: newUser.id,
    })

    // Create JWT token
    const token = await createToken(newUser.id, newUser.email, 'USER')

    const safeUser = toSafeUser(newUser)

    const response = NextResponse.json(
      {
        data: safeUser,
        message: 'Account created successfully',
        redirectTo: '/dashboard',
      },
      { status: 201 }
    )

    // Set cookie
    response.cookies.set('gt_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}