'use client'
import { useAccounts } from '@/hooks/useAccounts'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function ReportsPage() {
  const { activeAccount } = useAccounts()
  const { analytics } = useAnalytics(activeAccount?.id, 30)

  const downloadCSV = async () => {
    const res = await fetch('/api/trades')
    const { data } = await res.json()
    if (!data || data.length === 0) return alert('No trades to export')
    const headers = ['Symbol','Market','Direction','Status','Entry','Exit','PnL','Session','Opened At','Closed At','Discipline','Strategy']
    const rows = data.map((t: any) => [
      t.symbol, t.market_type, t.direction, t.status,
      t.entry_price || '', t.exit_price || '', t.pnl_amount || '',
      t.session || '', t.opened_at || '', t.closed_at || '',
      t.discipline_score || '', t.strategy_name || '',
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'ghost-trader-trades.csv'; a.click()
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: 'white', fontWeight: '800', fontSize: '22px', margin: '0 0 4px 0' }}>Reports & Export</h1>
        <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Download your trading data and performance reports</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { title: 'Export Trades CSV', desc: 'Download all your trades as a spreadsheet', icon: '📊', action: downloadCSV, color: '#3b82f6' },
          { title: 'Performance Report', desc: 'Monthly summary with analytics', icon: '📈', action: () => alert('PDF reports coming soon'), color: '#10b981' },
          { title: 'Psychology Report', desc: 'Emotion and discipline analysis', icon: '🧠', action: () => alert('Psychology reports coming soon'), color: '#a855f7' },
          { title: 'Risk Report', desc: 'Risk management overview', icon: '⚖️', action: () => alert('Risk reports coming soon'), color: '#f59e0b' },
        ].map(({ title, desc, icon, action, color }) => (
          <div key={title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
            <h3 style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginBottom: '6px' }}>{title}</h3>
            <p style={{ color: '#475569', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>{desc}</p>
            <button onClick={action}
              style={{
                width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${color}40`,
                background: `${color}15`, color, fontWeight: '700', fontSize: '13px', cursor: 'pointer',
              }}>
              Download →
            </button>
          </div>
        ))}
      </div>

      {analytics && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginBottom: '20px' }}>Quick Stats Summary (Last 30 Days)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Total Trades', value: analytics.total_trades },
              { label: 'Win Rate', value: `${analytics.win_rate.toFixed(1)}%` },
              { label: 'Total PnL', value: `$${analytics.total_pnl.toFixed(2)}` },
              { label: 'Profit Factor', value: analytics.profit_factor.toFixed(2) },
              { label: 'Avg R:R', value: analytics.avg_risk_reward.toFixed(2) },
              { label: 'Max Drawdown', value: `${analytics.max_drawdown.toFixed(1)}%` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'rgba(59,130,246,0.05)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ color: '#475569', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                <div style={{ color: 'white', fontWeight: '800', fontSize: '18px' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}