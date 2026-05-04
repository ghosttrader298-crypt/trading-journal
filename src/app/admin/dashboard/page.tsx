'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const kpis = stats ? [
    { label: 'Total Users', value: stats.total_users, icon: '👥', color: '#3b82f6' },
    { label: 'Active Users', value: stats.active_users, icon: '✅', color: '#10b981' },
    { label: 'Suspended', value: stats.suspended_users, icon: '🚫', color: '#ef4444' },
    { label: 'Total Trades', value: stats.total_trades, icon: '📋', color: '#a855f7' },
    { label: 'Open Tickets', value: stats.open_tickets, icon: '🎫', color: '#f59e0b' },
  ] : []

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: 'white', fontWeight: '800', fontSize: '24px', margin: '0 0 4px 0' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
          Platform overview and management
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>Loading...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '14px', marginBottom: '28px',
          }}>
            {kpis.map(kpi => (
              <div key={kpi.label} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(239,68,68,0.12)',
                borderRadius: '14px', padding: '18px',
              }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>{kpi.icon}</div>
                <div style={{ color: '#475569', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {kpi.label}
                </div>
                <div style={{ color: kpi.color, fontWeight: '800', fontSize: '28px' }}>
                  {kpi.value}
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(239,68,68,0.12)',
            borderRadius: '16px', padding: '24px', marginBottom: '20px',
          }}>
            <h3 style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { label: '👥 Manage Users', href: '/admin/users', color: '#3b82f6' },
                { label: '📢 Send Announcement', href: '/admin/announcements', color: '#10b981' },
                { label: '🎫 View Tickets', href: '/admin/tickets', color: '#f59e0b' },
              ].map(({ label, href, color }) => (
                <button key={href}
                  onClick={() => router.push(href)}
                  style={{
                    padding: '10px 18px', borderRadius: '10px', border: `1px solid ${color}30`,
                    background: `${color}10`, color, fontWeight: '600',
                    fontSize: '13px', cursor: 'pointer',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent registrations */}
          {stats?.recent_registrations && stats.recent_registrations.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(239,68,68,0.12)',
              borderRadius: '16px', padding: '24px',
            }}>
              <h3 style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>
                Recent Registrations (Last 7 days)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.recent_registrations.slice(0, 8).map((u: any, i: number) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(239,68,68,0.07)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '12px', fontWeight: '700',
                      }}>
                        {u.email?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>{u.email}</span>
                    </div>
                    <span style={{ color: '#475569', fontSize: '11px' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}