'use client'
import { useState } from 'react'
import { useAccounts } from '@/hooks/useAccounts'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function AnalyticsPage() {
  const { activeAccount } = useAccounts()
  const [days, setDays] = useState(30)
  const { analytics, loading } = useAnalytics(activeAccount?.id, days)

  const kpis = analytics ? [
    { label: 'Total Trades', value: analytics.total_trades, icon: '📊' },
    { label: 'Win Rate', value: `${analytics.win_rate.toFixed(1)}%`, color: '#10b981', icon: '🎯' },
    { label: 'Total PnL', value: `$${analytics.total_pnl.toFixed(2)}`, color: analytics.total_pnl >= 0 ? '#3b82f6' : '#ef4444', icon: '💰' },
    { label: 'Profit Factor', value: analytics.profit_factor.toFixed(2), color: analytics.profit_factor >= 1.5 ? '#10b981' : '#f59e0b', icon: '⚡' },
    { label: 'Avg R:R', value: analytics.avg_risk_reward.toFixed(2), icon: '⚖️' },
    { label: 'Expectancy', value: `$${analytics.expectancy.toFixed(2)}`, color: analytics.expectancy >= 0 ? '#3b82f6' : '#ef4444', icon: '📈' },
    { label: 'Max Drawdown', value: `${analytics.max_drawdown.toFixed(1)}%`, color: analytics.max_drawdown > 10 ? '#ef4444' : '#94a3b8', icon: '📉' },
    { label: 'Avg Discipline', value: `${analytics.avg_discipline_score.toFixed(1)}/10`, color: '#a855f7', icon: '🧠' },
  ] : []

  return (
    <div style={{ maxWidth: '1400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ color: 'white', fontWeight: '800', fontSize: '22px', margin: '0 0 4px 0' }}>Analytics</h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Detailed performance breakdown</p>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[7, 30, 90, 180, 365].map(d => (
            <button key={d} onClick={() => setDays(d)}
              style={{
                padding: '7px 14px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                background: days === d ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                color: days === d ? '#60a5fa' : '#64748b',
              }}>{d}D</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>Loading analytics...</div>
      ) : (
        <>
          {/* KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '28px' }}>
            {kpis.map(kpi => (
              <div key={kpi.label} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)',
                borderRadius: '14px', padding: '18px',
              }}>
                <div style={{ fontSize: '20px', marginBottom: '10px' }}>{kpi.icon}</div>
                <div style={{ color: '#475569', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px' }}>{kpi.label}</div>
                <div style={{ color: kpi.color || 'white', fontWeight: '800', fontSize: '22px' }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {/* Equity Curve */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginBottom: '20px' }}>📈 Equity Curve</h3>
              {analytics?.equity_curve && analytics.equity_curve.length > 1 ? (
                <svg width="100%" height="200" viewBox="0 0 600 200" preserveAspectRatio="none">
                  {(() => {
                    const data = analytics.equity_curve
                    const vals = data.map(d => d.equity)
                    const min = Math.min(...vals)
                    const max = Math.max(...vals)
                    const range = max - min || 1
                    const pts = data.map((d, i) => {
                      const x = (i / (data.length - 1)) * 600
                      const y = 200 - ((d.equity - min) / range) * 180 - 10
                      return `${x},${y}`
                    }).join(' ')
                    const lastVal = vals[vals.length - 1]
                    const c = lastVal >= 0 ? '#3b82f6' : '#ef4444'
                    return (
                      <>
                        <defs>
                          <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={c} stopOpacity="0.4"/>
                            <stop offset="100%" stopColor={c} stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        <polygon points={`0,200 ${pts} 600,200`} fill="url(#eg)"/>
                        <polyline points={pts} fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </>
                    )
                  })()}
                </svg>
              ) : (
                <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                  Not enough data for equity curve
                </div>
              )}
            </div>

            {/* Win/Loss */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginBottom: '20px' }}>🎯 Win / Loss</h3>
              {analytics && analytics.total_trades > 0 ? (
                <div style={{ textAlign: 'center' }}>
                  <svg viewBox="0 0 120 120" width="140" height="140">
                    {(() => {
                      const wr = analytics.win_rate / 100
                      const r = 45
                      const cx = 60, cy = 60
                      const c = 2 * Math.PI * r
                      const winDash = wr * c
                      const lossDash = c - winDash
                      return (
                        <>
                          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(239,68,68,0.2)" strokeWidth="18"/>
                          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#3b82f6" strokeWidth="18"
                            strokeDasharray={`${winDash} ${lossDash}`} strokeDashoffset={c / 4}
                            strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}/>
                          <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="18" fontWeight="800">{analytics.win_rate.toFixed(0)}%</text>
                          <text x={cx} y={cy + 14} textAnchor="middle" fill="#475569" fontSize="10">Win Rate</text>
                        </>
                      )
                    })()}
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#3b82f6', fontWeight: '800', fontSize: '20px' }}>{analytics.winning_trades}</div>
                      <div style={{ color: '#475569', fontSize: '11px' }}>Wins</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#ef4444', fontWeight: '800', fontSize: '20px' }}>{analytics.losing_trades}</div>
                      <div style={{ color: '#475569', fontSize: '11px' }}>Losses</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>No trade data</div>
              )}
            </div>
          </div>

          {/* PnL by Weekday + Session */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { title: '📅 PnL by Weekday', data: analytics?.pnl_by_weekday || {} },
              { title: '🌐 PnL by Session', data: analytics?.pnl_by_session || {} },
            ].map(({ title, data }) => (
              <div key={title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>{title}</h3>
                {Object.keys(data).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(data).sort(([,a],[,b]) => b - a).map(([key, pnl]) => {
                      const max = Math.max(...Object.values(data).map(Math.abs))
                      const pct = max > 0 ? (Math.abs(pnl) / max) * 100 : 0
                      return (
                        <div key={key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>{key}</span>
                            <span style={{ color: pnl >= 0 ? '#3b82f6' : '#ef4444', fontSize: '12px', fontWeight: '700' }}>
                              {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                            </span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                            <div style={{ height: '100%', borderRadius: '3px', width: `${pct}%`, background: pnl >= 0 ? '#3b82f6' : '#ef4444' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#475569', padding: '30px', fontSize: '13px' }}>No data yet</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}