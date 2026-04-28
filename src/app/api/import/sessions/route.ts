import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'

export const GET = requireUser(async (req, _ctx, user: JWTPayload) => {
  const { searchParams } = new URL(req.url)
  const account_id = searchParams.get('account_id')

  let query = supabaseAdmin
    .from('import_logs')
    .select('*')
    .eq('user_id', user.sub)
    .eq('status', 'COMPLETED')
    .order('created_at', { ascending: false })

  if (account_id) query = query.eq('account_id', account_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  return NextResponse.json({ data })
})

export const PATCH = requireUser(async (req, _ctx, user: JWTPayload) => {
  const { session_id, session_name } = await req.json()
  if (!session_id || !session_name) {
    return NextResponse.json({ error: 'session_id and session_name required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('import_logs')
    .update({ session_name: session_name.trim() })
    .eq('id', session_id)
    .eq('user_id', user.sub)

  if (error) return NextResponse.json({ error: 'Failed to rename session' }, { status: 500 })
  return NextResponse.json({ message: 'Session renamed' })
})

export const DELETE = requireUser(async (req, _ctx, user: JWTPayload) => {
  const { searchParams } = new URL(req.url)
  const session_id = searchParams.get('session_id')
  if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

  await supabaseAdmin
    .from('trades')
    .delete()
    .eq('import_session_id', session_id)
    .eq('user_id', user.sub)

  await supabaseAdmin
    .from('import_logs')
    .delete()
    .eq('id', session_id)
    .eq('user_id', user.sub)

  return NextResponse.json({ message: 'Session deleted' })
})