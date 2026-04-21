import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { toSafeUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const jwtUser = await getUserFromRequest(request)

    if (!jwtUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', jwtUser.sub)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: toSafeUser(user) })
  } catch (error) {
    console.error('Me error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}