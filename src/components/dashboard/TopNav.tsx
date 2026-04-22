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
    <>
      <div style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '10px',
        borderBottom: '1px solid rgba(59,130,246,0.1)',
        background: 'rgba(5,8,16,0.8)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>

        {/* Search — hidden on mobile */}
        <div className="search-bar" style={{ flex: 1, maxWidth: '320px' }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input placeholder="Search trades..."
              style={{
                width: '100%', padding: '7px 10px 7px 32px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(59,130,246,0.15)',
                borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>

          {/* Add Trade */}
          <button onClick={() => router.push('/dashboard/trade-log?add=1')}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '8px 12px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none', color: 'white', fontSize: '13px',
              fontWeight: '600', cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
            }}>
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
            <span className="btn-text">Add Trade</span>
          </button>

          {/* Account Switcher */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setShowAccountMenu(!showAccountMenu); setShowProfileMenu(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 10px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(59,130,246,0.2)',
                color: 'white', fontSize: '12px', cursor: 'pointer',
                whiteSpace: 'nowrap', maxWidth: '160px',
              }}>
              <div style={{
                width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                background: accountColors[activeAccount?.account_type || 'LIVE'],
                boxShadow: `0 0 5px ${accountColors[activeAccount?.account_type || 'LIVE']}`,
              }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }} className="account-name">
                {activeAccount?.name || 'Account'}
              </span>
              <span style={{ color: '#475569', fontSize: '9px', flexShrink: 0 }}>▼</span>
            </button>

            {showAccountMenu && (
              <div style={{
                position: 'fixed', top: '64px', right: '16px',
                background: '#0a0f1e', border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: '12px', padding: '8px', minWidth: '200px', zIndex: 1000,
                boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
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
                      width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                      background: accountColors[acc.account_type],
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {acc.name}
                      </div>
                      <div style={{ color: '#475569', fontSize: '11px' }}>
                        {acc.account_type} • {acc.currency}
                      </div>
                    </div>
                    {activeAccount?.id === acc.id && <span style={{ color: '#3b82f6' }}>✓</span>}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid rgba(59,130,246,0.1)', marginTop: '6px', paddingTop: '6px' }}>
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
                width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                border: '2px solid rgba(59,130,246,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
              }}>
              {user?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'G'}
            </button>

            {showProfileMenu && (
              <div style={{
                position: 'fixed', top: '64px', right: '16px',
                background: '#0a0f1e', border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: '12px', padding: '8px', minWidth: '180px', zIndex: 1000,
                boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
              }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(59,130,246,0.1)', marginBottom: '4px' }}>
                  <div style={{ color: 'white', fontWeight: '600', fontSize: '13px' }}>
                    {user?.display_name || user?.email?.split('@')[0]}
                  </div>
                  <div style={{ color: '#475569', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.email}
                  </div>
                </div>
                {[
                  { label: '⚙️ Settings', href: '/dashboard/settings' },
                  { label: '📄 Reports', href: '/dashboard/reports' },
                ].map(item => (
                  <button key={item.href}
                    onClick={() => { router.push(item.href); setShowProfileMenu(false) }}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
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

      {/* Click outside to close */}
      {(showAccountMenu || showProfileMenu) && (
        <div
          onClick={() => { setShowAccountMenu(false); setShowProfileMenu(false) }}
          style={{ position: 'fixed', inset: 0, zIndex: 999 }}
        />
      )}

      <style>{`
        @media (max-width: 640px) {
          .search-bar { display: none !important; }
          .btn-text { display: none; }
          .account-name { display: none !important; }
        }
      `}</style>
    </>
  )
}