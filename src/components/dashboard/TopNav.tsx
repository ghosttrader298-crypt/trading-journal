'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useAccounts } from '@/hooks/useAccounts'
import { TradingAccount } from '@/types'

interface ImportSession {
  id: string
  session_name: string
  file_name: string
  imported_rows: number
  account_id: string
}

export default function TopNav() {
  const { user } = useAuth()
  const { accounts, activeAccount, switchAccount } = useAccounts()
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showSessionMenu, setShowSessionMenu] = useState(false)
  const [sessions, setSessions] = useState<ImportSession[]>([])
  const [activeSession, setActiveSession] = useState<ImportSession | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const sessionMenuRef = useRef<HTMLDivElement>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  const sessionId = searchParams.get('session')

  // Fetch sessions on mount
  useEffect(() => {
    fetch('/api/import/sessions')
      .then(r => r.json())
      .then(d => {
        const data: ImportSession[] = d.data || []
        setSessions(data)
        if (sessionId) {
          const found = data.find(s => s.id === sessionId)
          setActiveSession(found || null)
        }
      })
      .catch(() => {})
  }, [sessionId])

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        sessionMenuRef.current && !sessionMenuRef.current.contains(target)
      ) setShowSessionMenu(false)
      if (
        accountMenuRef.current && !accountMenuRef.current.contains(target)
      ) setShowAccountMenu(false)
      if (
        profileMenuRef.current && !profileMenuRef.current.contains(target)
      ) setShowProfileMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const accountColors: Record<string, string> = {
    LIVE: '#10b981', DEMO: '#f59e0b', FUNDED: '#3b82f6', PROP: '#a855f7',
  }
  const sessionColors = ['#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4']

  const switchSession = (session: ImportSession | null) => {
    setActiveSession(session)
    setShowSessionMenu(false)
    if (session) {
      router.push(`${pathname}?session=${session.id}`)
    } else {
      router.push(pathname)
    }
  }

  return (
    <div style={{
      height: '64px', display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: '10px',
      borderBottom: '1px solid rgba(59,130,246,0.1)',
      background: 'rgba(5,8,16,0.8)', backdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 40,
    }}>

      {/* Search */}
      <div className="search-bar" style={{ flex: 1, maxWidth: '320px' }}>
        <div style={{ position: 'relative' }}>
          <svg style={{
            position: 'absolute', left: '10px', top: '50%',
            transform: 'translateY(-50%)', color: '#475569',
          }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input placeholder="Search trades..."
            style={{
              width: '100%', padding: '7px 10px 7px 32px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(59,130,246,0.15)',
              borderRadius: '8px', color: 'white',
              fontSize: '13px', outline: 'none', boxSizing: 'border-box',
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
            fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
          }}>
          <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
          <span className="btn-text">Add Trade</span>
        </button>

        {/* ── Session Switcher ── */}
        {sessions.length > 0 && (
          <div ref={sessionMenuRef} style={{ position: 'relative' }}>
            {/* Trigger button */}
            {activeSession ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setShowSessionMenu(v => !v)
                    setShowAccountMenu(false)
                    setShowProfileMenu(false)
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 10px', borderRadius: '8px 0 0 8px',
                    background: 'rgba(59,130,246,0.15)',
                    border: '1px solid rgba(59,130,246,0.4)',
                    borderRight: 'none',
                    color: '#60a5fa', fontSize: '12px',
                    fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                  <span>📦</span>
                  <span className="session-name" style={{
                    maxWidth: '90px', overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {activeSession.session_name || activeSession.file_name}
                  </span>
                  <span style={{ fontSize: '9px', color: '#3b82f6' }}>▼</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    switchSession(null)
                  }}
                  style={{
                    padding: '6px 9px',
                    borderRadius: '0 8px 8px 0',
                    background: 'rgba(59,130,246,0.15)',
                    border: '1px solid rgba(59,130,246,0.4)',
                    color: '#60a5fa', fontSize: '14px',
                    fontWeight: '700', cursor: 'pointer', lineHeight: 1,
                  }}>
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowSessionMenu(v => !v)
                  setShowAccountMenu(false)
                  setShowProfileMenu(false)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 12px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  color: '#64748b', fontSize: '12px',
                  fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                <span>📦</span>
                <span className="session-name">Switch Session</span>
                <span style={{ fontSize: '9px' }}>▼</span>
              </button>
            )}

            {/* Dropdown */}
            {showSessionMenu && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: '#0d1117',
                border: '1px solid rgba(59,130,246,0.25)',
                borderRadius: '14px', padding: '8px',
                minWidth: '250px', maxHeight: '380px', overflowY: 'auto',
                zIndex: 9999,
                boxShadow: '0 24px 48px rgba(0,0,0,0.8)',
              }}>
                {/* Header */}
                <div style={{
                  padding: '8px 12px 10px',
                  borderBottom: '1px solid rgba(59,130,246,0.1)',
                  marginBottom: '6px',
                }}>
                  <div style={{ color: 'white', fontWeight: '700', fontSize: '13px' }}>
                    Import Sessions
                  </div>
                  <div style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>
                    Select to filter all dashboard pages
                  </div>
                </div>

                {/* All Data option */}
                <button
                  onClick={() => switchSession(null)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 12px', borderRadius: '8px', border: 'none',
                    background: !activeSession ? 'rgba(59,130,246,0.12)' : 'transparent',
                    color: 'white', cursor: 'pointer', textAlign: 'left',
                    marginBottom: '4px',
                  }}>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px',
                  }}>📊</div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: !activeSession ? '#60a5fa' : 'white' }}>
                      All Data
                    </div>
                    <div style={{ color: '#475569', fontSize: '11px' }}>
                      Combined — {sessions.reduce((s, x) => s + x.imported_rows, 0)} total trades
                    </div>
                  </div>
                  {!activeSession && (
                    <span style={{ color: '#3b82f6', marginLeft: 'auto', fontSize: '14px' }}>✓</span>
                  )}
                </button>

                {/* Divider */}
                <div style={{
                  borderTop: '1px solid rgba(59,130,246,0.08)',
                  margin: '4px 0 6px',
                }} />

                {/* Session list */}
                {sessions.map((session, index) => {
                  const color = sessionColors[index % sessionColors.length]
                  const isActive = activeSession?.id === session.id
                  return (
                    <button
                      key={session.id}
                      onClick={() => switchSession(session)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '9px 12px', borderRadius: '8px', border: 'none',
                        background: isActive ? `${color}18` : 'transparent',
                        color: 'white', cursor: 'pointer', textAlign: 'left',
                        marginBottom: '2px',
                      }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                        background: `${color}20`, border: `1px solid ${color}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color, fontSize: '11px', fontWeight: '800',
                      }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: '600', fontSize: '13px',
                          color: isActive ? color : 'white',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {session.session_name || session.file_name}
                        </div>
                        <div style={{ color: '#475569', fontSize: '11px' }}>
                          {session.imported_rows} trades
                        </div>
                      </div>
                      {isActive && (
                        <span style={{ color, flexShrink: 0, fontSize: '14px' }}>✓</span>
                      )}
                    </button>
                  )
                })}

                {/* Footer */}
                <div style={{
                  borderTop: '1px solid rgba(59,130,246,0.08)',
                  marginTop: '6px', paddingTop: '6px',
                }}>
                  <button
                    onClick={() => {
                      router.push('/dashboard/import-sessions')
                      setShowSessionMenu(false)
                    }}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '8px',
                      border: '1px dashed rgba(59,130,246,0.3)',
                      background: 'transparent', color: '#3b82f6',
                      fontSize: '12px', cursor: 'pointer', fontWeight: '600',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '6px',
                    }}>
                    📦 Manage Sessions →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Account Switcher ── */}
        <div ref={accountMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowAccountMenu(v => !v)
              setShowSessionMenu(false)
              setShowProfileMenu(false)
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 10px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(59,130,246,0.2)',
              color: 'white', fontSize: '12px', cursor: 'pointer',
              whiteSpace: 'nowrap', maxWidth: '170px',
            }}>
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
              background: accountColors[activeAccount?.account_type || 'LIVE'],
              boxShadow: `0 0 5px ${accountColors[activeAccount?.account_type || 'LIVE']}`,
            }} />
            <span style={{
              overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px',
            }} className="account-name">
              {activeAccount?.name || 'Account'}
            </span>
            <span style={{ color: '#475569', fontSize: '9px', flexShrink: 0 }}>▼</span>
          </button>

          {showAccountMenu && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: '#0d1117',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '12px', padding: '8px',
              minWidth: '200px', zIndex: 9999,
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            }}>
              {accounts.map((acc: TradingAccount) => (
                <button key={acc.id}
                  onClick={() => { switchAccount(acc); setShowAccountMenu(false) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 12px', borderRadius: '8px', border: 'none',
                    background: activeAccount?.id === acc.id
                      ? 'rgba(59,130,246,0.12)' : 'transparent',
                    color: 'white', cursor: 'pointer', textAlign: 'left', fontSize: '13px',
                  }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                    background: accountColors[acc.account_type],
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: '600',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {acc.name}
                    </div>
                    <div style={{ color: '#475569', fontSize: '11px' }}>
                      {acc.account_type} • {acc.currency}
                    </div>
                  </div>
                  {activeAccount?.id === acc.id && (
                    <span style={{ color: '#3b82f6' }}>✓</span>
                  )}
                </button>
              ))}
              <div style={{
                borderTop: '1px solid rgba(59,130,246,0.1)',
                marginTop: '6px', paddingTop: '6px',
              }}>
                <button
                  onClick={() => { router.push('/dashboard/settings'); setShowAccountMenu(false) }}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: '8px',
                    border: '1px dashed rgba(59,130,246,0.3)',
                    background: 'transparent', color: '#3b82f6',
                    fontSize: '12px', cursor: 'pointer', fontWeight: '600',
                  }}>
                  + Add Account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Profile ── */}
        <div ref={profileMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowProfileMenu(v => !v)
              setShowAccountMenu(false)
              setShowSessionMenu(false)
            }}
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
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: '#0d1117',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '12px', padding: '8px',
              minWidth: '190px', zIndex: 9999,
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            }}>
              <div style={{
                padding: '8px 12px',
                borderBottom: '1px solid rgba(59,130,246,0.1)',
                marginBottom: '4px',
              }}>
                <div style={{ color: 'white', fontWeight: '600', fontSize: '13px' }}>
                  {user?.display_name || user?.email?.split('@')[0]}
                </div>
                <div style={{
                  color: '#475569', fontSize: '11px',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {user?.email}
                </div>
              </div>
              {[
                { label: '⚙️ Settings', href: '/dashboard/settings' },
                { label: '📄 Reports', href: '/dashboard/reports' },
                { label: '📦 Import Sessions', href: '/dashboard/import-sessions' },
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

      <style>{`
        @media (max-width: 640px) {
          .search-bar { display: none !important; }
          .btn-text { display: none; }
          .account-name { display: none !important; }
          .session-name { display: none !important; }
        }
      `}</style>
    </div>
  )
}