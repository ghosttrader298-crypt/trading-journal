import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'

export const GET = requireUser(async (req, _ctx, user: JWTPayload) => {
  const { searchParams } = new URL(req.url)
  const account_id = searchParams.get('account_id')
  const import_session_id = searchParams.get('import_session_id')
  const days = parseInt(searchParams.get('days') || '30')

  let query = supabaseAdmin
    .from('trades')
    .select('*')
    .eq('user_id', user.sub)
    .eq('status', 'CLOSED')

  if (import_session_id) {
    // Filter by specific import session — ignore date and account filters
    query = query.eq('import_session_id', import_session_id)
  } else {
    // Normal mode — filter by date range and optionally account
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    query = query.gte('closed_at', startDate.toISOString())
    if (account_id) query = query.eq('account_id', account_id)
  }

  const { data: trades, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }

  if (!trades || trades.length === 0) {
    return NextResponse.json({
      data: {
        total_trades: 0, winning_trades: 0, losing_trades: 0,
        win_rate: 0, total_pnl: 0, avg_pnl: 0, best_trade: 0, worst_trade: 0,
        profit_factor: 0, avg_risk_reward: 0, expectancy: 0, max_drawdown: 0,
        avg_discipline_score: 0, revenge_trades: 0, fomo_trades: 0,
        daily_pnl: [], equity_curve: [], pnl_by_session: {}, pnl_by_weekday: {}, pnl_by_setup: {},
      },
    })
  }

  const total_trades = trades.length
  const winning_trades = trades.filter(t => (t.pnl_amount || 0) > 0).length
  const losing_trades = trades.filter(t => (t.pnl_amount || 0) < 0).length
  const win_rate = (winning_trades / total_trades) * 100
  const total_pnl = trades.reduce((sum, t) => sum + (t.pnl_amount || 0), 0)
  const avg_pnl = total_pnl / total_trades
  const pnl_values = trades.map(t => t.pnl_amount || 0)
  const best_trade = Math.max(...pnl_values)
  const worst_trade = Math.min(...pnl_values)

  const gross_profit = trades.filter(t => (t.pnl_amount || 0) > 0).reduce((sum, t) => sum + (t.pnl_amount || 0), 0)
  const gross_loss = Math.abs(trades.filter(t => (t.pnl_amount || 0) < 0).reduce((sum, t) => sum + (t.pnl_amount || 0), 0))
  const profit_factor = gross_loss > 0 ? gross_profit / gross_loss : gross_profit > 0 ? 999 : 0

  const rr_values = trades.filter(t => t.risk_reward).map(t => t.risk_reward || 0)
  const avg_risk_reward = rr_values.length > 0 ? rr_values.reduce((a, b) => a + b, 0) / rr_values.length : 0

  const avg_win = winning_trades > 0 ? gross_profit / winning_trades : 0
  const avg_loss = losing_trades > 0 ? gross_loss / losing_trades : 0
  const expectancy = (win_rate / 100) * avg_win - ((100 - win_rate) / 100) * avg_loss

  // Max drawdown
  let peak = 0, max_drawdown = 0, running = 0
  trades
    .sort((a, b) => new Date(a.closed_at!).getTime() - new Date(b.closed_at!).getTime())
    .forEach(t => {
      running += t.pnl_amount || 0
      if (running > peak) peak = running
      const dd = peak > 0 ? ((peak - running) / peak) * 100 : 0
      if (dd > max_drawdown) max_drawdown = dd
    })

  const discipline_scores = trades.filter(t => t.discipline_score).map(t => t.discipline_score!)
  const avg_discipline_score = discipline_scores.length > 0
    ? discipline_scores.reduce((a, b) => a + b, 0) / discipline_scores.length : 0
  const revenge_trades = trades.filter(t => t.is_revenge_trade).length
  const fomo_trades = trades.filter(t => t.is_fomo_trade).length

  const dailyMap: Record<string, number> = {}
  trades.forEach(t => {
    const date = t.closed_at?.split('T')[0] || ''
    if (date) dailyMap[date] = (dailyMap[date] || 0) + (t.pnl_amount || 0)
  })
  const daily_pnl = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => ({ date, pnl }))

  let equity = 0
  const equity_curve = daily_pnl.map(({ date, pnl }) => {
    equity += pnl
    return { date, equity }
  })

  const pnl_by_session: Record<string, number> = {}
  trades.forEach(t => {
    const s = t.session || 'UNKNOWN'
    pnl_by_session[s] = (pnl_by_session[s] || 0) + (t.pnl_amount || 0)
  })

  const pnl_by_weekday: Record<string, number> = {}
  const days_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  trades.forEach(t => {
    if (t.closed_at) {
      const day = days_names[new Date(t.closed_at).getDay()]
      pnl_by_weekday[day] = (pnl_by_weekday[day] || 0) + (t.pnl_amount || 0)
    }
  })

  const pnl_by_setup: Record<string, number> = {}
  trades.forEach(t => {
    const setup = t.setup_type || 'Unknown'
    pnl_by_setup[setup] = (pnl_by_setup[setup] || 0) + (t.pnl_amount || 0)
  })

  return NextResponse.json({
    data: {
      total_trades,
      winning_trades,
      losing_trades,
      win_rate: Math.round(win_rate * 100) / 100,
      total_pnl: Math.round(total_pnl * 100) / 100,
      avg_pnl: Math.round(avg_pnl * 100) / 100,
      best_trade: Math.round(best_trade * 100) / 100,
      worst_trade: Math.round(worst_trade * 100) / 100,
      profit_factor: Math.round(profit_factor * 100) / 100,
      avg_risk_reward: Math.round(avg_risk_reward * 100) / 100,
      expectancy: Math.round(expectancy * 100) / 100,
      max_drawdown: Math.round(max_drawdown * 100) / 100,
      avg_discipline_score: Math.round(avg_discipline_score * 100) / 100,
      revenge_trades,
      fomo_trades,
      daily_pnl,
      equity_curve,
      pnl_by_session,
      pnl_by_weekday,
      pnl_by_setup,
    },
  })
})