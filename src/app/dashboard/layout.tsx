'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/dashboard/Sidebar'
import TopNav from '@/components/dashboard/TopNav'

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
    if (!loading && user && (user.role === 'SUPER_ADMIN' || user.role === 'VIEW_ONLY_ADMIN')) {
      router.push('/admin/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#050810',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            </svg>
          </div>
          <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: '600' }}>Loading Ghost Trader...</div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050810' }}>
      <Sidebar />
      <div style={{
        flex: 1,
        marginLeft: '240px',
        display: 'flex', flexDirection: 'column',
        minHeight: '100vh',
        transition: 'margin-left 0.2s ease',
      }} className="dashboard-content">
        <TopNav />
        <main style={{ flex: 1, padding: '24px', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .dashboard-content { margin-left: 0 !important; padding-top: 64px; }
        }
      `}</style>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  )
}