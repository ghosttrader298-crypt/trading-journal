import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export const POST = requireUser(async (req, _ctx, user: JWTPayload) => {
  const { message } = await req.json()

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: trades } = await supabaseAdmin
    .from('trades')
    .select('*')
    .eq('user_id', user.sub)
    .eq('status', 'CLOSED')
    .gte('closed_at', thirtyDaysAgo.toISOString())
    .order('closed_at', { ascending: false })
    .limit(50)

  const totalTrades = trades?.length || 0
  const winningTrades = trades?.filter(t => (t.pnl_amount || 0) > 0).length || 0
  const totalPnl = trades?.reduce((sum, t) => sum + (t.pnl_amount || 0), 0) || 0
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : '0'
  const revengeTrades = trades?.filter(t => t.is_revenge_trade).length || 0
  const fomoTrades = trades?.filter(t => t.is_fomo_trade).length || 0
  const avgDiscipline = trades && trades.length > 0
    ? (trades.reduce((sum, t) => sum + (t.discipline_score || 0), 0) / trades.length).toFixed(1)
    : '0'

  const systemPrompt = `You are Ghost Trader AI Coach, an expert trading psychology coach and performance analyst.

Current trader stats (last 30 days):
- Total trades: ${totalTrades}
- Win rate: ${winRate}%
- Total PnL: $${totalPnl.toFixed(2)}
- Revenge trades: ${revengeTrades}
- FOMO trades: ${fomoTrades}
- Avg discipline score: ${avgDiscipline}/10

Be concise, direct, and actionable. Focus on psychology, risk management, and performance improvement.
Use data from their stats when relevant. Keep responses under 200 words unless asked for detail.`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || 'I could not generate a response.'

    return NextResponse.json({ data: { response } })
  } catch (error) {
    console.error('Groq error:', error)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 })
  }
})