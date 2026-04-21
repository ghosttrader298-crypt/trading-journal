import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    const store = global.__gt_otps__
    const record = store?.get(email.toLowerCase())

    if (!record) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    if (Date.now() > record.expires) {
      store?.delete(email.toLowerCase())
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    if (record.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP code' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'OTP verified successfully',
      verified: true,
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}