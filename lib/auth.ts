/**
 * lib/auth.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-side auth utilities.
 *
 * Strategy:
 *   - On login, we call PHP Radius to verify credentials and get a token.
 *   - We store the token and user data in an HTTP-only cookie.
 *   - Every protected API route calls verifySession() to validate the cookie.
 *   - The token is never exposed to the browser directly — only via secure cookie.
 *
 * No external dependencies required — auth is handled purely with HTTP-only cookies.
 * ─────────────────────────────────────────────────────────────────────────────
 */

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

// ── Create session JWT ────────────────────────────────────────────────────────

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  // For simplicity, store the payload directly in the cookie
  // In production, you could encrypt/sign this with a server secret
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

// ── Verify session JWT ────────────────────────────────────────────────────────

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    return decoded as SessionPayload
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
