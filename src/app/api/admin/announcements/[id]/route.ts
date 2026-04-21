import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'

export const PATCH = requireAdmin(async (req, ctx, user: JWTPayload) => {
  const body = await req.json()

  const { data: existing } = await supabaseAdmin
    .from('announcements')
    .select('id')
    .eq('id', ctx.params.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
  }

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .update(body)
    .eq('id', ctx.params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
  }

  return NextResponse.json({ data })
})

export const DELETE = requireAdmin(async (req, ctx, _user: JWTPayload) => {
  const { data: existing } = await supabaseAdmin
    .from('announcements')
    .select('id')
    .eq('id', ctx.params.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
  }

  await supabaseAdmin
    .from('announcements')
    .delete()
    .eq('id', ctx.params.id)

  return NextResponse.json({ message: 'Announcement deleted' })
})