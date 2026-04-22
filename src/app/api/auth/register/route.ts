import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, toSafeUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

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

    const password_hash = await hashPassword(password)

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

    // No cookie set — user must log in manually
    return NextResponse.json(
      {
        data: toSafeUser(newUser),
        message: 'Account created successfully',
        redirectTo: '/auth/login',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}