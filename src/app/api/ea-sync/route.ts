import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// EA sends trades directly via API key
// No JWT needed — uses API key auth
export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    // Look up user by API key stored in user metadata
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('notification_preferences->>ea_api_key', apiKey)
      .limit(1)

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const userId = users[0].id
    const body = await req.json()
    const { account_id, trades } = body

    if (!account_id || !trades || !Array.isArray(trades)) {
      return NextResponse.json({ error: 'account_id and trades array required' }, { status: 400 })
    }

    // Verify account belongs to user
    const { data: account } = await supabaseAdmin
      .from('trading_accounts')
      .select('id')
      .eq('id', account_id)
      .eq('user_id', userId)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Get existing broker IDs to prevent duplicates
    const { data: existing } = await supabaseAdmin
      .from('trades')
      .select('broker_trade_id')
      .eq('account_id', account_id)
      .not('broker_trade_id', 'is', null)

    const existingIds = new Set((existing || []).map(t => t.broker_trade_id))

    const toInsert = []
    const duplicates = []

    for (const trade of trades) {
      if (trade.broker_trade_id && existingIds.has(String(trade.broker_trade_id))) {
        duplicates.push(trade.broker_trade_id)
        continue
      }

      const detectMarket = (sym: string) => {
        const s = sym?.toUpperCase() || ''
        if (/BTC|ETH|XRP|ADA|SOL|DOGE/.test(s)) return 'CRYPTO'
        if (/US30|SPX|NAS|DAX|FTSE|GER/.test(s)) return 'FUTURES'
        if (/AAPL|TSLA|AMZN|GOOGL|MSFT/.test(s)) return 'STOCKS'
        return 'FOREX'
      }

      toInsert.push({
        user_id: userId,
        account_id,
        symbol: (trade.symbol || '').toUpperCase(),
        market_type: detectMarket(trade.symbol),
        direction: trade.direction === 1 || trade.direction?.toString().toUpperCase() === 'BUY' ? 'BUY' : 'SELL',
        status: trade.status === 'OPEN' ? 'OPEN' : 'CLOSED',
        entry_price: trade.entry_price || trade.open_price || null,
        exit_price: trade.exit_price || trade.close_price || null,
        stop_loss: trade.stop_loss || trade.sl || null,
        take_profit: trade.take_profit || trade.tp || null,
        pnl_amount: trade.pnl || trade.profit || trade.pnl_amount || null,
        position_size: trade.lots || trade.volume || trade.size || null,
        fees: trade.commission || trade.swap || trade.fees || 0,
        opened_at: trade.open_time || trade.opened_at || new Date().toISOString(),
        closed_at: trade.close_time || trade.closed_at || null,
        broker_trade_id: trade.ticket || trade.id || trade.broker_trade_id || null,
        strategy_name: trade.comment || trade.strategy || null,
        imported_at: new Date().toISOString(),
      })
    }

    let inserted = 0
    if (toInsert.length > 0) {
      for (let i = 0; i < toInsert.length; i += 50) {
        const batch = toInsert.slice(i, i + 50)
        const { error } = await supabaseAdmin.from('trades').insert(batch)
        if (!error) inserted += batch.length
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      duplicates: duplicates.length,
      message: `Synced ${inserted} trades`,
    })
  } catch (error) {
    console.error('EA sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

// EA polls this to confirm connection
export async function GET(req: Request) {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey) return NextResponse.json({ error: 'API key required' }, { status: 401 })

  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, email, display_name')
    .eq('notification_preferences->>ea_api_key', apiKey)
    .limit(1)

  if (!users || users.length === 0) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  return NextResponse.json({
    connected: true,
    trader: users[0].display_name || users[0].email,
    timestamp: new Date().toISOString(),
  })
}