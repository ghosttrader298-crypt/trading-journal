import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { toSafeUser } from '@/lib/auth'
import { JWTPayload } from '@/types'

export const GET = requireAdmin(async (req, ctx, _admin: JWTPayload) => {
  const { id: userId } = await ctx.params
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'user'

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (type === 'user' || !type) {
    return NextResponse.json({ data: toSafeUser(user) })
  }

  if (type === 'trades') {
    const { data } = await supabaseAdmin
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .order('opened_at', { ascending: false })
      .limit(200)
    return NextResponse.json({ data: data || [] })
  }

  if (type === 'sessions') {
    const { data } = await supabaseAdmin
      .from('import_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: false })
    return NextResponse.json({ data: data || [] })
  }

  if (type === 'journals') {
    const { data } = await supabaseAdmin
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(50)
    return NextResponse.json({ data: data || [] })
  }

  if (type === 'goals') {
    const { data } = await supabaseAdmin
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
    return NextResponse.json({ data: data || [] })
  }

  if (type === 'analytics') {
    const { data: trades } = await supabaseAdmin
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'CLOSED')

    if (!trades || trades.length === 0) {
      return NextResponse.json({
        data: {
          total_trades: 0, winning_trades: 0, losing_trades: 0,
          win_rate: 0, total_pnl: 0, profit_factor: 0,
          avg_risk_reward: 0, max_drawdown: 0,
          avg_discipline_score: 0, revenge_trades: 0, fomo_trades: 0,
        }
      })
    }

    const total_trades = trades.length
    const winning_trades = trades.filter(t => (t.pnl_amount || 0) > 0).length
    const losing_trades = trades.filter(t => (t.pnl_amount || 0) < 0).length
    const win_rate = (winning_trades / total_trades) * 100
    const total_pnl = trades.reduce((s, t) => s + (t.pnl_amount || 0), 0)
    const gross_profit = trades.filter(t => (t.pnl_amount || 0) > 0).reduce((s, t) => s + (t.pnl_amount || 0), 0)
    const gross_loss = Math.abs(trades.filter(t => (t.pnl_amount || 0) < 0).reduce((s, t) => s + (t.pnl_amount || 0), 0))
    const profit_factor = gross_loss > 0 ? gross_profit / gross_loss : gross_profit > 0 ? 999 : 0
    const revenge_trades = trades.filter(t => t.is_revenge_trade).length
    const fomo_trades = trades.filter(t => t.is_fomo_trade).length
    const disc = trades.filter(t => t.discipline_score)
    const avg_discipline_score = disc.length > 0
      ? disc.reduce((s, t) => s + t.discipline_score, 0) / disc.length : 0

    let peak = 0, max_drawdown = 0, running = 0
    trades.sort((a, b) => new Date(a.closed_at!).getTime() - new Date(b.closed_at!).getTime())
      .forEach(t => {
        running += t.pnl_amount || 0
        if (running > peak) peak = running
        const dd = peak > 0 ? ((peak - running) / peak) * 100 : 0
        if (dd > max_drawdown) max_drawdown = dd
      })

    return NextResponse.json({
      data: {
        total_trades, winning_trades, losing_trades,
        win_rate: Math.round(win_rate * 100) / 100,
        total_pnl: Math.round(total_pnl * 100) / 100,
        profit_factor: Math.round(profit_factor * 100) / 100,
        max_drawdown: Math.round(max_drawdown * 100) / 100,
        avg_discipline_score: Math.round(avg_discipline_score * 100) / 100,
        revenge_trades, fomo_trades,
      }
    })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
})