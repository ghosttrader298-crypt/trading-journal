import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'

export const GET = requireUser(async (req, ctx, user: JWTPayload) => {
  const { data, error } = await supabaseAdmin
    .from('journal_entries')
    .select('*')
    .eq('id', ctx.params.id)
    .eq('user_id', user.sub)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  }

  return NextResponse.json({ data })
})

export const PATCH = requireUser(async (req, ctx, user: JWTPayload) => {
  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from('journal_entries')
    .update(body)
    .eq('id', ctx.params.id)
    .eq('user_id', user.sub)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  }

  return NextResponse.json({ data })
})

export const DELETE = requireUser(async (req, ctx, user: JWTPayload) => {
  await supabaseAdmin
    .from('journal_entries')
    .delete()
    .eq('id', ctx.params.id)
    .eq('user_id', user.sub)

  return NextResponse.json({ message: 'Entry deleted' })
})