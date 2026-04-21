import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// In-memory OTP store (use Redis in production)
declare global {
  var __gt_otps__: Map<string, { otp: string; expires: number }> | undefined
}
if (!global.__gt_otps__) {
  global.__gt_otps__ = new Map()
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check user exists
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single()

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If this email exists, an OTP has been sent',
      })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = Date.now() + 10 * 60 * 1000 // 10 minutes

    global.__gt_otps__!.set(email.toLowerCase(), { otp, expires })

    // In development, log the OTP
    if (process.env.NODE_ENV !== 'production') {
      console.log(`OTP for ${email}: ${otp}`)
    }

    return NextResponse.json({
      message: 'If this email exists, an OTP has been sent',
      // Remove in production:
      ...(process.env.NODE_ENV === 'development' && { dev_otp: otp }),
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}