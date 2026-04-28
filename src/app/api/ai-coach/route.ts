import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export const POST = requireUser(async (req, _ctx, user: JWTPayload) => {
  const { message, import_session_id, session_name } = await req.json()

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  // Build trade query — session-specific OR last 30 days
  let query = supabaseAdmin
    .from('trades')
    .select('*')
    .eq('user_id', user.sub)
    .eq('status', 'CLOSED')
    .order('closed_at', { ascending: false })
    .limit(100)

  if (import_session_id) {
    query = query.eq('import_session_id', import_session_id)
  } else {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    query = query.gte('closed_at', thirtyDaysAgo.toISOString())
  }

  const { data: trades } = await query

  const totalTrades = trades?.length || 0
  const winningTrades = trades?.filter(t => (t.pnl_amount || 0) > 0).length || 0
  const losingTrades = trades?.filter(t => (t.pnl_amount || 0) < 0).length || 0
  const totalPnl = trades?.reduce((sum, t) => sum + (t.pnl_amount || 0), 0) || 0
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : '0'
  const revengeTrades = trades?.filter(t => t.is_revenge_trade).length || 0
  const fomoTrades = trades?.filter(t => t.is_fomo_trade).length || 0
  const avgDiscipline = trades && trades.length > 0
    ? (trades.reduce((sum, t) => sum + (t.discipline_score || 0), 0) / trades.length).toFixed(1)
    : '0'

  const grossProfit = trades?.filter(t => (t.pnl_amount || 0) > 0).reduce((sum, t) => sum + (t.pnl_amount || 0), 0) || 0
  const grossLoss = Math.abs(trades?.filter(t => (t.pnl_amount || 0) < 0).reduce((sum, t) => sum + (t.pnl_amount || 0), 0) || 0)
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? '∞' : '0'

  // Get symbol breakdown
  const symbolBreakdown = trades?.reduce((acc: Record<string, { count: number; pnl: number }>, t) => {
    const sym = t.symbol || 'UNKNOWN'
    if (!acc[sym]) acc[sym] = { count: 0, pnl: 0 }
    acc[sym].count++
    acc[sym].pnl += t.pnl_amount || 0
    return acc
  }, {}) || {}

  const topSymbols = Object.entries(symbolBreakdown)
    .sort(([, a], [, b]) => Math.abs(b.pnl) - Math.abs(a.pnl))
    .slice(0, 5)
    .map(([sym, data]) => `${sym}: ${data.count} trades, PnL $${data.pnl.toFixed(2)}`)
    .join(' | ')

  const contextLabel = import_session_id && session_name
    ? `Import Session: "${session_name}"`
    : 'Last 30 days'

  const systemPrompt = `You are Ghost Trader AI Coach, an expert trading psychology and performance analyst.

You are analyzing data from: ${contextLabel}

Trader performance stats:
- Total trades: ${totalTrades}
- Winning trades: ${winningTrades}
- Losing trades: ${losingTrades}
- Win rate: ${winRate}%
- Total PnL: $${totalPnl.toFixed(2)}
- Gross profit: $${grossProfit.toFixed(2)}
- Gross loss: $${grossLoss.toFixed(2)}
- Profit factor: ${profitFactor}
- Revenge trades: ${revengeTrades}
- FOMO trades: ${fomoTrades}
- Avg discipline score: ${avgDiscipline}/10
- Top symbols: ${topSymbols || 'No data'}

${import_session_id ? `IMPORTANT: The trader is asking specifically about the "${session_name}" import session. Reference this session by name in your responses. All stats above are ONLY from this specific session.` : ''}

Be concise, direct, and actionable. Reference specific numbers from the stats above.
Keep responses under 200 words unless the trader asks for detail.`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 600,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || 'I could not generate a response.'
    return NextResponse.json({ data: { response } })
  } catch (error) {
    console.error('Groq error:', error)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 })
  }
})