'use client'
import { useState, useEffect, Suspense } from 'react'
import { useAccounts } from '@/hooks/useAccounts'
import { useSearchParams, useRouter } from 'next/navigation'

interface AnalyticsData {
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  total_pnl: number
  avg_discipline_score: number
  revenge_trades: number
  fomo_trades: number
  avg_risk_reward: number
  max_drawdown: number
  profit_factor: number
}

function PsychologyContent() {
  const { activeAccount } = useAccounts()
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session') || undefined

  const [sessionName, setSessionName] = useState<string>('')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [tradeDetails, setTradeDetails] = useState<any[]>([])
  const [tradeLoading, setTradeLoading] = useState(true)

  // Fetch analytics
  useEffect(() => {
    const fetch_analytics = async () => {
      setAnalyticsLoading(true)
      try {
        const params = new URLSearchParams()
        if (sessionId) {
          params.set('import_session_id', sessionId)
        } else {
          params.set('days', '30')
          if (activeAccount?.id) params.set('account_id', activeAccount.id)
        }
        const res = await fetch(`/api/analytics?${params}`)
        const { data } = await res.json()
        setAnalytics(data || null)
      } catch (e) {
        console.error(e)
      } finally {
        setAnalyticsLoading(false)
      }
    }
    fetch_analytics()
  }, [sessionId, activeAccount?.id])

  // Fetch trades for psychology breakdown
  useEffect(() => {
    const fetchTrades = async () => {
      setTradeLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('limit', '500')
        if (sessionId) {
          params.set('import_session_id', sessionId)
        } else if (activeAccount?.id) {
          params.set('account_id', activeAccount.id)
        }
        const res = await fetch(`/api/trades?${params}`)
        const { data } = await res.json()
        setTradeDetails(data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setTradeLoading(false)
      }
    }
    fetchTrades()
  }, [sessionId, activeAccount?.id])

  // Fetch session name
  useEffect(() => {
    if (!sessionId) return
    fetch('/api/import/sessions')
      .then(r => r.json())
      .then(d => {
        const session = d.data?.find((s: any) => s.id === sessionId)
        if (session) setSessionName(session.session_name || session.file_name)
      })
      .catch(() => {})
  }, [sessionId])

  // Psychology stats from trades
  const hasPsychData = tradeDetails.some(t =>
    t.discipline_score || t.confidence_before ||
    t.fear_score || t.greed_score ||
    t.is_revenge_trade || t.is_fomo_trade ||
    t.emotional_state
  )

  const psychStats = tradeDetails.length > 0 ? (() => {
    const withDiscipline = tradeDetails.filter(t => t.discipline_score > 0)
    const withConfidence = tradeDetails.filter(t => t.confidence_before > 0)
    const withFear = tradeDetails.filter(t => t.fear_score > 0)
    const withGreed = tradeDetails.filter(t => t.greed_score > 0)

    return {
      avg_discipline: withDiscipline.length > 0
        ? withDiscipline.reduce((s, t) => s + t.discipline_score, 0) / withDiscipline.length
        : 0,
      avg_confidence: withConfidence.length > 0
        ? withConfidence.reduce((s, t) => s + t.confidence_before, 0) / withConfidence.length
        : 0,
      avg_fear: withFear.length > 0
        ? withFear.reduce((s, t) => s + t.fear_score, 0) / withFear.length
        : 0,
      avg_greed: withGreed.length > 0
        ? withGreed.reduce((s, t) => s + t.greed_score, 0) / withGreed.length
        : 0,
      revenge_count: tradeDetails.filter(t => t.is_revenge_trade === true).length,
      fomo_count: tradeDetails.filter(t => t.is_fomo_trade === true).length,
      emotional_states: tradeDetails.reduce((acc: Record<string, number>, t) => {
        if (t.emotional_state) acc[t.emotional_state] = (acc[t.emotional_state] || 0) + 1
        return acc
      }, {}),
      followed_rules_count: tradeDetails.filter(t =>
        Array.isArray(t.followed_rules) && t.followed_rules.length > 0
      ).length,
      broken_rules_count: tradeDetails.filter(t =>
        Array.isArray(t.broken_rules) && t.broken_rules.length > 0
      ).length,
    }
  })() : null

  const loading = analyticsLoading || tradeLoading

  const safeNum = (v: any) => (typeof v === 'number' && !isNaN(v) ? v : 0)

  const winRate = safeNum(analytics?.win_rate)
  const discipline = safeNum(analytics?.avg_discipline_score)
  const revenge = safeNum(analytics?.revenge_trades)
  const fomo = safeNum(analytics?.fomo_trades)

  const emotionColors: Record<string, string> = {
    Focused: '#3b82f6', Confident: '#10b981', Calm: '#06b6d4',
    Nervous: '#f59e0b', Excited: '#a855f7', Fearful: '#ef4444',
    Greedy: '#f97316', Frustrated: '#dc2626',
  }

  return (
    <div style={{ maxWidth: '1000px' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ color: 'white', fontWeight: '800', fontSize: '22px', margin: '0 0 4px 0' }}>
          🧠 Psychology Tracker
        </h1>
        <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
          {sessionId
            ? `Session: ${sessionName || 'Loading...'}`
            : 'Monitor your emotional state and trading psychology'}
        </p>
      </div>

      {/* Session banner */}
      {sessionId && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderRadius: '12px', marginBottom: '20px',
          background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>📦</span>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>
              Psychology data for{' '}
              <strong style={{ color: 'white' }}>{sessionName || 'this session'}</strong>
              <span style={{ color: '#475569', marginLeft: '8px' }}>
                ({tradeDetails.length} trades)
              </span>
            </span>
          </div>
          <button
            onClick={() => router.push('/dashboard/psychology')}
            style={{
              padding: '6px 14px', borderRadius: '8px',
              border: '1px solid rgba(168,85,247,0.3)',
              background: 'transparent', color: '#c084fc',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer',
            }}>
            ✕ View All
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          Loading psychology data...
        </div>
      ) : (
        <>
          {/* No psychology data warning for CSV imports */}
          {!hasPsychData && tradeDetails.length > 0 && (
            <div style={{
              padding: '16px 20px', borderRadius: '12px', marginBottom: '20px',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
              display: 'flex', gap: '12px', alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>💡</span>
              <div>
                <div style={{ color: '#f59e0b', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>
                  Psychology fields not available for CSV imports
                </div>
                <div style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6' }}>
                  The {tradeDetails.length} trades in this session were imported from a CSV and don&apos;t
                  contain psychology data (discipline scores, emotional states, etc.).
                  Psychology data is only available for trades added manually through the Add Trade form.
                  The performance analytics below are still accurate.
                </div>
              </div>
            </div>
          )}

          {/* Core metrics — always shown */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '14px', marginBottom: '20px',
          }}>
            {[
              {
                label: 'Win Rate',
                value: `${winRate.toFixed(1)}%`,
                color: winRate >= 50 ? '#3b82f6' : '#f59e0b',
                icon: '🎯',
                bar: winRate / 100,
                desc: winRate >= 50 ? 'Above 50% — positive edge' : 'Below 50% — focus on quality',
              },
              {
                label: 'Total Trades',
                value: safeNum(analytics?.total_trades),
                color: 'white',
                icon: '📋',
                bar: Math.min(safeNum(analytics?.total_trades) / 200, 1),
                desc: `${safeNum(analytics?.winning_trades)}W / ${safeNum(analytics?.losing_trades)}L`,
              },
              {
                label: 'Total PnL',
                value: `$${safeNum(analytics?.total_pnl).toFixed(2)}`,
                color: safeNum(analytics?.total_pnl) >= 0 ? '#3b82f6' : '#ef4444',
                icon: '💰',
                bar: Math.min(Math.abs(safeNum(analytics?.total_pnl)) / 5000, 1),
                desc: safeNum(analytics?.total_pnl) >= 0 ? 'Profitable session' : 'Loss session',
              },
              {
                label: 'Max Drawdown',
                value: `${safeNum(analytics?.max_drawdown).toFixed(1)}%`,
                color: safeNum(analytics?.max_drawdown) > 10 ? '#ef4444' : '#10b981',
                icon: '📉',
                bar: Math.min(safeNum(analytics?.max_drawdown) / 30, 1),
                desc: safeNum(analytics?.max_drawdown) > 10 ? 'High — reduce size' : 'Controlled drawdown',
              },
            ].map(m => (
              <div key={m.label} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(59,130,246,0.15)',
                borderRadius: '16px', padding: '18px',
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{m.icon}</div>
                <div style={{ color: '#475569', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {m.label}
                </div>
                <div style={{ color: m.color, fontWeight: '800', fontSize: '22px', marginBottom: '8px' }}>
                  {m.value}
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '6px' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(Number(m.bar) * 100, 100)}%`,
                    background: m.color,
                    borderRadius: '2px',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <div style={{ color: '#475569', fontSize: '11px' }}>{m.desc}</div>
              </div>
            ))}
          </div>

          {/* Psychology scores — only shown if data exists */}
          {hasPsychData && psychStats && (
            <>
              {/* Psychology metric cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '14px', marginBottom: '20px',
              }}>
                {[
                  {
                    label: 'Avg Discipline',
                    value: `${psychStats.avg_discipline.toFixed(1)}/10`,
                    color: psychStats.avg_discipline >= 7 ? '#10b981' : psychStats.avg_discipline >= 5 ? '#f59e0b' : '#ef4444',
                    icon: '🧠',
                    bar: psychStats.avg_discipline / 10,
                    desc: psychStats.avg_discipline >= 7 ? 'Excellent' : psychStats.avg_discipline >= 5 ? 'Needs work' : 'Critical',
                    show: psychStats.avg_discipline > 0,
                  },
                  {
                    label: 'Revenge Trades',
                    value: psychStats.revenge_count,
                    color: psychStats.revenge_count > 0 ? '#ef4444' : '#10b981',
                    icon: '😤',
                    bar: Math.min(psychStats.revenge_count / 10, 1),
                    desc: psychStats.revenge_count > 0 ? 'Detected!' : 'None — great!',
                    show: true,
                  },
                  {
                    label: 'FOMO Trades',
                    value: psychStats.fomo_count,
                    color: psychStats.fomo_count > 0 ? '#f59e0b' : '#10b981',
                    icon: '😰',
                    bar: Math.min(psychStats.fomo_count / 10, 1),
                    desc: psychStats.fomo_count > 0 ? 'Watch out!' : 'None — disciplined!',
                    show: true,
                  },
                  {
                    label: 'Avg Confidence',
                    value: `${psychStats.avg_confidence.toFixed(1)}/10`,
                    color: psychStats.avg_confidence >= 6 ? '#10b981' : '#f59e0b',
                    icon: '💪',
                    bar: psychStats.avg_confidence / 10,
                    desc: psychStats.avg_confidence >= 6 ? 'High confidence' : 'Low confidence',
                    show: psychStats.avg_confidence > 0,
                  },
                ].filter(m => m.show).map(m => (
                  <div key={m.label} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(59,130,246,0.15)',
                    borderRadius: '16px', padding: '18px',
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{m.icon}</div>
                    <div style={{ color: '#475569', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {m.label}
                    </div>
                    <div style={{ color: m.color, fontWeight: '800', fontSize: '22px', marginBottom: '8px' }}>
                      {m.value}
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '6px' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(Number(m.bar) * 100, 100)}%`,
                        background: m.color,
                        borderRadius: '2px',
                      }} />
                    </div>
                    <div style={{ color: '#475569', fontSize: '11px' }}>{m.desc}</div>
                  </div>
                ))}
              </div>

              {/* Fear & Greed scores */}
              {(psychStats.avg_fear > 0 || psychStats.avg_greed > 0) && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(59,130,246,0.15)',
                  borderRadius: '16px', padding: '20px', marginBottom: '20px',
                }}>
                  <h3 style={{ color: 'white', fontWeight: '700', fontSize: '14px', marginBottom: '16px' }}>
                    📊 Trade Psychology Scores
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { label: 'Avg Fear Score', value: psychStats.avg_fear, invert: true },
                      { label: 'Avg Greed Score', value: psychStats.avg_greed, invert: true },
                    ].filter(s => s.value > 0).map(({ label, value, invert }) => {
                      const pct = (value / 10) * 100
                      const color = invert
                        ? (value <= 3 ? '#10b981' : value <= 6 ? '#f59e0b' : '#ef4444')
                        : (value >= 7 ? '#10b981' : value >= 4 ? '#f59e0b' : '#ef4444')
                      return (
                        <div key={label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>{label}</span>
                            <span style={{ color, fontSize: '13px', fontWeight: '700' }}>{value.toFixed(1)}/10</span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Rules adherence */}
              {(psychStats.followed_rules_count > 0 || psychStats.broken_rules_count > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>✅</div>
                    <div style={{ color: '#10b981', fontWeight: '800', fontSize: '28px' }}>{psychStats.followed_rules_count}</div>
                    <div style={{ color: '#475569', fontSize: '12px', marginTop: '4px' }}>trades followed rules</div>
                  </div>
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>❌</div>
                    <div style={{ color: '#ef4444', fontWeight: '800', fontSize: '28px' }}>{psychStats.broken_rules_count}</div>
                    <div style={{ color: '#475569', fontSize: '12px', marginTop: '4px' }}>trades broke rules</div>
                  </div>
                </div>
              )}

              {/* Emotional states */}
              {Object.keys(psychStats.emotional_states).length > 0 && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(59,130,246,0.15)',
                  borderRadius: '16px', padding: '20px', marginBottom: '20px',
                }}>
                  <h3 style={{ color: 'white', fontWeight: '700', fontSize: '14px', marginBottom: '16px' }}>
                    💭 Emotional States During Trades
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(psychStats.emotional_states)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([state, count]) => {
                        const total = Object.values(psychStats.emotional_states)
                          .reduce((s: number, v) => s + (v as number), 0)
                        const pct = total > 0 ? ((count as number) / total) * 100 : 0
                        const color = emotionColors[state] || '#94a3b8'
                        return (
                          <div key={state}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>{state}</span>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <span style={{ color, fontSize: '12px', fontWeight: '700' }}>{count as number} trades</span>
                                <span style={{ color: '#475569', fontSize: '12px' }}>{pct.toFixed(0)}%</span>
                              </div>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px' }} />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* AI Psychology Insights — always shown */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: '16px', padding: '20px',
          }}>
            <h3 style={{ color: 'white', fontWeight: '700', fontSize: '14px', marginBottom: '16px' }}>
              🤖 Psychology Insights
              {sessionId && sessionName && (
                <span style={{ color: '#475569', fontSize: '12px', fontWeight: '400', marginLeft: '8px' }}>
                  — {sessionName}
                </span>
              )}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                winRate >= 50
                  ? { icon: '✅', text: `Win rate of ${winRate.toFixed(1)}% shows a positive edge. Keep sticking to your proven setups.`, color: '#10b981' }
                  : { icon: '📊', text: `Win rate of ${winRate.toFixed(1)}% is below 50%. Focus on fewer, higher quality setups. Quality over quantity.`, color: '#f59e0b' },

                safeNum(analytics?.max_drawdown) > 15
                  ? { icon: '⚠️', text: `Max drawdown of ${safeNum(analytics?.max_drawdown).toFixed(1)}% is high. Consider reducing position sizes by 25-50%.`, color: '#ef4444' }
                  : { icon: '💚', text: `Drawdown of ${safeNum(analytics?.max_drawdown).toFixed(1)}% is controlled. Good risk management.`, color: '#10b981' },

                hasPsychData && discipline > 0
                  ? (discipline < 6
                    ? { icon: '⚠️', text: `Discipline score of ${discipline.toFixed(1)}/10 needs work. Create a checklist and follow it strictly before each trade.`, color: '#f59e0b' }
                    : { icon: '💪', text: `Discipline score of ${discipline.toFixed(1)}/10 is strong. Your rule adherence is building consistency.`, color: '#3b82f6' })
                  : { icon: '💡', text: 'Add discipline scores when logging trades manually to track your psychology over time.', color: '#475569' },

                !hasPsychData && tradeDetails.length > 0
                  ? { icon: '📝', text: 'This is a CSV import session. Start logging trades manually with the Add Trade form to capture psychology data like discipline scores, emotional states, and rule adherence.', color: '#3b82f6' }
                  : { icon: '🎯', text: `${tradeDetails.length} trades analyzed. Keep logging your psychology on every trade for deeper insights.`, color: '#475569' },
              ].map((insight, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '12px', padding: '13px',
                  borderRadius: '10px',
                  background: `${insight.color}10`,
                  border: `1px solid ${insight.color}20`,
                }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{insight.icon}</span>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                    {insight.text}
                  </p>
                </div>
              ))}
            </div>

            {sessionId && (
              <button
                onClick={() => router.push(`/dashboard/ai-coach?session=${sessionId}`)}
                style={{
                  marginTop: '14px', width: '100%', padding: '11px',
                  borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                }}>
                🤖 Get AI Coach Psychology Analysis →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function PsychologyPage() {
  return (
    <Suspense fallback={
      <div style={{ color: '#3b82f6', padding: '40px', textAlign: 'center' }}>
        Loading...
      </div>
    }>
      <PsychologyContent />
    </Suspense>
  )
}