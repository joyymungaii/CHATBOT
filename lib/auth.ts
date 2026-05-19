/**
 * lib/auth.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-side auth utilities.
 *
 * Strategy:
 *   - On login, we call PHP Radius to verify credentials.
 *   - We then issue our OWN signed JWT (using a secret only we know).
 *   - That JWT is stored in an HTTP-only cookie — never readable by JS.
 *   - Every protected API route calls verifySession() to validate the cookie.
 *   - The PHP Radius token is stored INSIDE the JWT payload (server-side only).
 *
 * Why our own JWT instead of forwarding the Radius token directly?
 *   - We control expiry, payload shape, and rotation.
 *   - The Radius token never touches the browser at all.
 *   - We can add extra claims (username, plan) without extra round-trips.
 *
 * Environment variable required:
 *   SESSION_SECRET   — at least 32 random characters
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const COOKIE_NAME = 'nosteq_session'
const SESSION_DURATION = 60 * 60 * 8 // 8 hours in seconds

export interface SessionPayload {
  username: string
  radiusToken: string   // stored server-side in JWT, never sent to browser
  plan?: string
  status?: string
  iat?: number
  exp?: number
}

// ── Secret key ────────────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'SESSION_SECRET env variable is missing or too short (need 32+ chars). ' +
      'Add it to .env.local'
    )
  }
  return new TextEncoder().encode(secret)
}

// ── Create session JWT ────────────────────────────────────────────────────────

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecret())
}

// ── Verify session JWT ────────────────────────────────────────────────────────

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

// ── Read session from request cookies (for API routes) ───────────────────────

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

// ── Read session from server component cookies ────────────────────────────────

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

// ── Cookie config ─────────────────────────────────────────────────────────────

export const SESSION_COOKIE_OPTIONS = {
  name: COOKIE_NAME,
  httpOnly: true,          // not readable by JavaScript — XSS protection
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_DURATION,
}
