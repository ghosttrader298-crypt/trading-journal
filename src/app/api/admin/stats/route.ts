import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'

export const GET = requireAdmin(async (_req, _ctx, _user: JWTPayload) => {
  const [
    { count: total_users },
    { count: active_users },
    { count: suspended_users },
    { count: total_trades },
    { count: open_tickets },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE'),
    supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'SUSPENDED'),
    supabaseAdmin.from('trades').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'OPEN'),
  ])

  // Recent user registrations (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: recentUsers } = await supabaseAdmin
    .from('users')
    .select('created_at')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  return NextResponse.json({
    data: {
      total_users: total_users || 0,
      active_users: active_users || 0,
      suspended_users: suspended_users || 0,
      total_trades: total_trades || 0,
      open_tickets: open_tickets || 0,
      recent_registrations: recentUsers || [],
    },
  })
})