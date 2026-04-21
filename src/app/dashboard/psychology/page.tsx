'use client'
import { useAccounts } from '@/hooks/useAccounts'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function PsychologyPage() {
  const { activeAccount } = useAccounts()
  const { analytics, loading } = useAnalytics(activeAccount?.id, 30)

  const metrics = analytics ? [
    { label: 'Avg Discipline', value: `${analytics.avg_discipline_score.toFixed(1)}/10`, color: '#a855f7', icon: '🧠', bar: analytics.avg_discipline_score / 10 },
    { label: 'Revenge Trades', value: analytics.revenge_trades, color: analytics.revenge_trades > 0 ? '#ef4444' : '#10b981', icon: '😤', bar: Math.min(analytics.revenge_trades / 10, 1) },
    { label: 'FOMO Trades', value: analytics.fomo_trades, color: analytics.fomo_trades > 0 ? '#f59e0b' : '#10b981', icon: '😰', bar: Math.min(analytics.fomo_trades / 10, 1) },
    { label: 'Win Rate', value: `${analytics.win_rate.toFixed(1)}%`, color: '#3b82f6', icon: '🎯', bar: analytics.win_rate / 100 },
  ] : []

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: 'white', fontWeight: '800', fontSize: '22px', margin: '0 0 4px 0' }}>Psychology Tracker</h1>
        <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Monitor your emotional state and trading psychology</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>Loading...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            {metrics.map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{m.icon}</div>
                <div style={{ color: '#475569', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px' }}>{m.label}</div>
                <div style={{ color: m.color, fontWeight: '800', fontSize: '26px', marginBottom: '12px' }}>{m.value}</div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                  <div style={{ height: '100%', width: `${m.bar * 100}%`, background: m.color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>🧠 Psychology Insights</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                analytics && analytics.revenge_trades > 2
                  ? { icon: '🚨', text: `You have ${analytics.revenge_trades} revenge trades. This is a serious risk to your account. After a loss, step away for 30 minutes before trading again.`, color: '#ef4444' }
                  : { icon: '✅', text: 'Revenge trading is under control. Keep maintaining emotional discipline.', color: '#10b981' },
                analytics && analytics.avg_discipline_score < 6
                  ? { icon: '⚠️', text: 'Your discipline score is below 6/10. Review your trading rules and create a pre-trade checklist.', color: '#f59e0b' }
                  : { icon: '💪', text: `Discipline score of ${analytics?.avg_discipline_score.toFixed(1)}/10 is solid. Consistency is your edge.`, color: '#3b82f6' },
                analytics && analytics.win_rate < 40
                  ? { icon: '📊', text: 'Win rate below 40%. Focus on setup quality — take fewer, higher quality trades.', color: '#ef4444' }
                  : { icon: '🎯', text: `${analytics?.win_rate.toFixed(1)}% win rate. Maintain your edge by sticking to proven setups only.`, color: '#10b981' },
              ].map((insight, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '14px', borderRadius: '12px', background: `${insight.color}10`, border: `1px solid ${insight.color}25` }}>
                  <span style={{ fontSize: '20px' }}>{insight.icon}</span>
                  <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}