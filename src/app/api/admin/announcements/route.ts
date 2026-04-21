import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'

export const GET = requireAdmin(async (_req, _ctx, _user: JWTPayload) => {
  const { data, error } = await supabaseAdmin
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }

  return NextResponse.json({ data })
})

export const POST = requireAdmin(async (req, _ctx, user: JWTPayload) => {
  const body = await req.json()

  if (!body.title || !body.body) {
    return NextResponse.json(
      { error: 'Title and body are required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .insert({ ...body, created_by: user.sub })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
})