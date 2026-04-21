import { NextResponse } from 'next/server'
import { getUserFromRequest, revokeToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)

    if (user) {
      await revokeToken(user.jti)
    }

    const response = NextResponse.json({
      message: 'Logged out successfully',
    })

    response.cookies.delete('gt_token')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    const response = NextResponse.json({ message: 'Logged out' })
    response.cookies.delete('gt_token')
    return response
  }
}