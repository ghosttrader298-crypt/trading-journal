import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/route-guards'
import { supabaseAdmin } from '@/lib/supabase'
import { toSafeUser } from '@/lib/auth'
import { JWTPayload } from '@/types'

export const GET = requireUser(async (req, _ctx, user: JWTPayload) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', user.sub)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ data: toSafeUser(data) })
})

export const PATCH = requireUser(async (req, _ctx, user: JWTPayload) => {
  const body = await req.json()

  // Only allow safe fields to be updated
  const allowedFields = [
    'display_name',
    'avatar_url',
    'timezone',
    'preferred_currency',
    'default_broker',
    'risk_tolerance',
    'notification_preferences',
  ]

  const updateData: Record<string, any> = {}
  allowedFields.forEach(field => {
    if (body[field] !== undefined) {
      updateData[field] = body[field]
    }
  })

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', user.sub)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  return NextResponse.json({ data: toSafeUser(data) })
})