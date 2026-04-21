import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'

export const GET = requireUser(async (req, _ctx, user: JWTPayload) => {
  const { searchParams } = new URL(req.url)
  const account_id = searchParams.get('account_id')
  const status = searchParams.get('status')
  const market_type = searchParams.get('market_type')
  const direction = searchParams.get('direction')
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabaseAdmin
    .from('trades')
    .select('*', { count: 'exact' })
    .eq('user_id', user.sub)
    .order('opened_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (account_id) query = query.eq('account_id', account_id)
  if (status) query = query.eq('status', status)
  if (market_type) query = query.eq('market_type', market_type)
  if (direction) query = query.eq('direction', direction)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 })
  }

  return NextResponse.json({ data, count })
})

export const POST = requireUser(async (req, _ctx, user: JWTPayload) => {
  const body = await req.json()

  if (!body.symbol || !body.market_type || !body.direction || !body.account_id) {
    return NextResponse.json(
      { error: 'Symbol, market type, direction and account are required' },
      { status: 400 }
    )
  }

  // Verify account ownership
  const { data: account } = await supabaseAdmin
    .from('trading_accounts')
    .select('id')
    .eq('id', body.account_id)
    .eq('user_id', user.sub)
    .single()

  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  const { data, error } = await supabaseAdmin
    .from('trades')
    .insert({ ...body, user_id: user.sub })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
})