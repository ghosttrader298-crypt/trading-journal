'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useAccounts } from '@/hooks/useAccounts'
import { TradingAccount } from '@/types'

export default function TopNav() {
  const { user } = useAuth()
  const { accounts, activeAccount, switchAccount } = useAccounts()
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const router = useRouter()

  const accountColors: Record<string, string> = {
    LIVE: '#10b981',
    DEMO: '#f59e0b',
    FUNDED: '#3b82f6',
    PROP: '#a855f7',
  }

  return (
    <div style={{
      height: '64px', display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: '16px',
      borderBottom: '1px solid rgba(59,130,246,0.1)',
      background: 'rgba(5,8,16,0.8)', backdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 40,
    }}>
      {/* Search */}
      <div style={{ flex: 1, maxWidth: '360px' }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input placeholder="Search trades, symbols..."
            style={{
              width: '100%', padding: '8px 12px 8px 36px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(59,130,246,0.15)',
              borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
        {/* Add Trade */}
        <button onClick={() => router.push('/dashboard/trade-log?add=1')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            border: 'none', color: 'white', fontSize: '13px',
            fontWeight: '600', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
          }}>
          <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
          Add Trade
        </button>

        {/* Account Switcher */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setShowAccountMenu(!showAccountMenu); setShowProfileMenu(false) }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '7px 12px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(59,130,246,0.2)',
              color: 'white', fontSize: '13px', cursor: 'pointer',
            }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: accountColors[activeAccount?.account_type || 'LIVE'],
              boxShadow: `0 0 6px ${accountColors[activeAccount?.account_type || 'LIVE']}`,
            }} />
            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeAccount?.name || 'Select Account'}
            </span>
            <span style={{ color: '#475569', fontSize: '10px' }}>▼</span>
          </button>

          {showAccountMenu && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '8px',
              background: '#0a0f1e', border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '12px', padding: '8px', minWidth: '200px', zIndex: 100,
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}>
              {accounts.map((acc: TradingAccount) => (
                <button key={acc.id}
                  onClick={() => { switchAccount(acc); setShowAccountMenu(false) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '8px', border: 'none',
                    background: activeAccount?.id === acc.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: 'white', cursor: 'pointer', textAlign: 'left', fontSize: '13px',
                  }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: accountColors[acc.account_type],
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {acc.name}
                    </div>
                    <div style={{ color: '#475569', fontSize: '11px' }}>
                      {acc.account_type} • {acc.currency}
                    </div>
                  </div>
                  {activeAccount?.id === acc.id && <span style={{ color: '#3b82f6', fontSize: '14px' }}>✓</span>}
                </button>
              ))}
              <div style={{ borderTop: '1px solid rgba(59,130,246,0.1)', marginTop: '8px', paddingTop: '8px' }}>
                <button onClick={() => { router.push('/dashboard/settings'); setShowAccountMenu(false) }}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: '8px',
                    border: '1px dashed rgba(59,130,246,0.3)', background: 'transparent',
                    color: '#3b82f6', fontSize: '12px', cursor: 'pointer', fontWeight: '600',
                  }}>
                  + Add Account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setShowProfileMenu(!showProfileMenu); setShowAccountMenu(false) }}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              border: '2px solid rgba(59,130,246,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
            }}>
            {user?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'G'}
          </button>

          {showProfileMenu && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '8px',
              background: '#0a0f1e', border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '12px', padding: '8px', minWidth: '180px', zIndex: 100,
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(59,130,246,0.1)', marginBottom: '4px' }}>
                <div style={{ color: 'white', fontWeight: '600', fontSize: '13px' }}>
                  {user?.display_name || user?.email?.split('@')[0]}
                </div>
                <div style={{ color: '#475569', fontSize: '11px' }}>{user?.email}</div>
              </div>
              {[
                { label: 'Settings', href: '/dashboard/settings' },
                { label: 'Reports', href: '/dashboard/reports' },
              ].map(item => (
                <button key={item.href}
                  onClick={() => { router.push(item.href); setShowProfileMenu(false) }}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: '8px',
                    border: 'none', background: 'transparent', color: '#94a3b8',
                    fontSize: '13px', cursor: 'pointer', textAlign: 'left',
                  }}>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}