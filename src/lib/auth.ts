import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { v4 as uuidv4 } from 'uuid'
import { supabaseAdmin } from './supabase'
import { SafeUser, User, JWTPayload, UserRole } from '@/types'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)
const JWT_EXPIRES_IN = '7d'

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Create JWT token
export async function createToken(
  userId: string,
  email: string,
  role: UserRole
): Promise<string> {
  const jti = uuidv4()

  const token = await new SignJWT({
    sub: userId,
    email,
    role,
    jti
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET)

  // Store session in database
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await supabaseAdmin.from('sessions').insert({
    user_id: userId,
    token_hash: jti,
    expires_at: expiresAt.toISOString()
  })

  return token
}

// Verify JWT token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const jwtPayload = payload as unknown as JWTPayload

    // Check session exists in DB
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('id, expires_at')
      .eq('token_hash', jwtPayload.jti)
      .single()

    if (!session) return null

    // Check not expired
    if (new Date(session.expires_at) < new Date()) {
      await supabaseAdmin
        .from('sessions')
        .delete()
        .eq('token_hash', jwtPayload.jti)
      return null
    }

    return jwtPayload
  } catch {
    return null
  }
}

// Revoke token (logout)
export async function revokeToken(jti: string): Promise<void> {
  await supabaseAdmin.from('sessions').delete().eq('token_hash', jti)
}

// Revoke all user tokens (password reset)
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await supabaseAdmin.from('sessions').delete().eq('user_id', userId)
}

// Convert user to safe user (no password)
export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    timezone: user.timezone,
    preferred_currency: user.preferred_currency,
    default_broker: user.default_broker,
    risk_tolerance: user.risk_tolerance,
    created_at: user.created_at,
    last_login_at: user.last_login_at
  }
}

// Get user from token in request
export async function getUserFromRequest(
  request: Request
): Promise<JWTPayload | null> {
  const cookie = request.headers.get('cookie')
  if (!cookie) return null

  const tokenMatch = cookie.match(/gt_token=([^;]+)/)
  if (!tokenMatch) return null

  return verifyToken(tokenMatch[1])
}