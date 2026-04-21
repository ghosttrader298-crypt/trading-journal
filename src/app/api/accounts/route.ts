import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'

export const GET = requireUser(async (req, _ctx, user: JWTPayload) => {
  const { data, error } = await supabaseAdmin
    .from('trading_accounts')
    .select('*')
    .eq('user_id', user.sub)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }

  return NextResponse.json({ data })
})

export const POST = requireUser(async (req, _ctx, user: JWTPayload) => {
  const body = await req.json()
  const { name, account_type, broker, currency, initial_balance } = body

  if (!name || !account_type) {
    return NextResponse.json(
      { error: 'Name and account type are required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('trading_accounts')
    .insert({
      user_id: user.sub,
      name,
      account_type,
      broker,
      currency: currency || 'USD',
      initial_balance: initial_balance || 0,
      current_balance: initial_balance || 0,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
})