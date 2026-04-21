import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'

export const GET = requireUser(async (req, _ctx, user: JWTPayload) => {
  const { data, error } = await supabaseAdmin
    .from('onboarding_states')
    .select('*')
    .eq('user_id', user.sub)
    .single()

  if (error || !data) {
    return NextResponse.json({ data: null })
  }

  return NextResponse.json({ data })
})

export const PATCH = requireUser(async (req, _ctx, user: JWTPayload) => {
  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from('onboarding_states')
    .update(body)
    .eq('user_id', user.sub)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update onboarding' }, { status: 500 })
  }

  return NextResponse.json({ data })
})