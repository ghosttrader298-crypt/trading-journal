import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'

export const GET = requireUser(async (req, ctx, user: JWTPayload) => {
  const { data, error } = await supabaseAdmin
    .from('trades')
    .select('*')
    .eq('id', ctx.params.id)
    .eq('user_id', user.sub)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
  }

  return NextResponse.json({ data })
})

export const PATCH = requireUser(async (req, ctx, user: JWTPayload) => {
  const body = await req.json()

  const { data: existing } = await supabaseAdmin
    .from('trades')
    .select('id')
    .eq('id', ctx.params.id)
    .eq('user_id', user.sub)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
  }

  const { data, error } = await supabaseAdmin
    .from('trades')
    .update(body)
    .eq('id', ctx.params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update trade' }, { status: 500 })
  }

  return NextResponse.json({ data })
})

export const DELETE = requireUser(async (req, ctx, user: JWTPayload) => {
  const { data: existing } = await supabaseAdmin
    .from('trades')
    .select('id')
    .eq('id', ctx.params.id)
    .eq('user_id', user.sub)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
  }

  await supabaseAdmin.from('trades').delete().eq('id', ctx.params.id)

  return NextResponse.json({ message: 'Trade deleted' })
})