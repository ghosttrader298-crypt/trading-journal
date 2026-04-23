import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { JWTPayload } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export const POST = requireUser(async (_req, _ctx, user: JWTPayload) => {
  // Generate new EA API key
  const ea_api_key = `gt_ea_${uuidv4().replace(/-/g, '')}`

  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('notification_preferences')
    .eq('id', user.sub)
    .single()

  const existing = userData?.notification_preferences || {}

  await supabaseAdmin
    .from('users')
    .update({
      notification_preferences: { ...existing, ea_api_key }
    })
    .eq('id', user.sub)

  return NextResponse.json({ data: { ea_api_key } })
})

export const GET = requireUser(async (_req, _ctx, user: JWTPayload) => {
  const { data } = await supabaseAdmin
    .from('users')
    .select('notification_preferences')
    .eq('id', user.sub)
    .single()

  const ea_api_key = data?.notification_preferences?.ea_api_key || null

  return NextResponse.json({ data: { ea_api_key } })
})