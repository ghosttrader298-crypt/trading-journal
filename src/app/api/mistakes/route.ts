import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'

export const GET = requireUser(async (req, _ctx, user: JWTPayload) => {
  const { data, error } = await supabaseAdmin
    .from('mistakes')
    .select('*')
    .eq('user_id', user.sub)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch mistakes' }, { status: 500 })
  return NextResponse.json({ data })
})

export const POST = requireUser(async (req, _ctx, user: JWTPayload) => {
  const body = await req.json()
  if (!body.mistake_type) {
    return NextResponse.json({ error: 'Mistake type is required' }, { status: 400 })
  }
  const { data, error } = await supabaseAdmin
    .from('mistakes')
    .insert({ ...body, user_id: user.sub })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to log mistake' }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
})