import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { toSafeUser } from '@/lib/auth'
import { JWTPayload } from '@/types'

export const GET = requireAdmin(async (req, _ctx, _user: JWTPayload) => {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabaseAdmin
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`)
  }

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  return NextResponse.json({
    data: data?.map(toSafeUser),
    count,
  })
})