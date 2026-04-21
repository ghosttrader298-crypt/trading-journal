import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'

export const GET = requireUser(async (req, _ctx, user: JWTPayload) => {
  const { data, error } = await supabaseAdmin
    .from('goals')
    .select('*')
    .eq('user_id', user.sub)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }

  return NextResponse.json({ data })
})

export const POST = requireUser(async (req, _ctx, user: JWTPayload) => {
  const body = await req.json()

  if (!body.title || !body.goal_type) {
    return NextResponse.json(
      { error: 'Title and goal type are required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('goals')
    .insert({ ...body, user_id: user.sub })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
})