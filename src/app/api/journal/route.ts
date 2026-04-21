import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'

export const GET = requireUser(async (req, _ctx, user: JWTPayload) => {
  const { searchParams } = new URL(req.url)
  const account_id = searchParams.get('account_id')

  let query = supabaseAdmin
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.sub)
    .order('date', { ascending: false })

  if (account_id) query = query.eq('account_id', account_id)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch journal' }, { status: 500 })
  }

  return NextResponse.json({ data })
})

export const POST = requireUser(async (req, _ctx, user: JWTPayload) => {
  const body = await req.json()

  if (!body.date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 })
  }

  // Upsert by user_id + date
  const { data, error } = await supabaseAdmin
    .from('journal_entries')
    .upsert(
      { ...body, user_id: user.sub },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to save journal entry' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
})