import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'

export const PATCH = requireAdmin(async (req, ctx, admin: JWTPayload) => {
  const { status, admin_reply } = await req.json()

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .update({
      status,
      admin_reply,
      replied_by: admin.sub,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ctx.params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  return NextResponse.json({ data })
})