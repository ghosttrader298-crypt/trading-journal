import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'

export const GET = requireAdmin(async (req, _ctx, _admin: JWTPayload) => {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabaseAdmin
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  return NextResponse.json({ data })
})