/**
 * app/api/login/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles user login.
 *
 * Flow:
 *   1. Receive { username, password } from the login form
 *   2. Forward credentials to PHP Radius login endpoint
 *   3. On success: extract user data, create a signed JWT, set HTTP-only cookie
 *   4. Return { ok: true, username } — NO token in the response body
 *
 * Security:
 *   - PHP Radius credentials (admin) never leave the server
 *   - The Radius token is stored inside the JWT, not in the response
 *   - The JWT lives in an HTTP-only cookie — JS cannot read it
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, SESSION_COOKIE_OPTIONS } from '@/lib/auth'

const RADIUS_BASE = (process.env.PHPRADIUS_BASE_URL || 'https://devs1.phpradius.com').replace(/\/$/, '')

export async function POST(req: NextRequest) {
  // 1. Parse request body
  let username: string
  let password: string

  try {
    const body = await req.json()
    username = (body.username || '').trim()
    password = (body.password || '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Username and password are required.' },
      { status: 400 }
    )
  }

  // 2. Call PHP Radius login endpoint with the USER's credentials
  //    (not the admin credentials — those are only used for data queries)
  let radiusToken: string
  let userData: Record<string, unknown> = {}

  try {
    const res = await fetch(`${RADIUS_BASE}/index.php/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const json = await res.json()

    if (!res.ok || json.error || json.status === 'error') {
      // PHP Radius returns 200 with error body in some versions
      const msg = json.message || json.error || 'Invalid username or password.'
      return NextResponse.json({ error: msg }, { status: 401 })
    }

    // Extract token — PHP Radius uses different field names across versions
    radiusToken = json.token || json.access_token || json.data?.token || ''

    if (!radiusToken) {
      return NextResponse.json(
        { error: 'Login failed: no token returned from authentication server.' },
        { status: 401 }
      )
    }

    // Extract user profile data if available
    userData = json.data || json.user || json.customer || {}

  } catch (err) {
    console.error('[Login] PHP Radius unreachable:', err)
    return NextResponse.json(
      { error: 'Authentication server is unavailable. Please try again.' },
      { status: 503 }
    )
  }

  // 3. Create our own signed JWT containing the Radius token
  const sessionToken = await createSessionToken({
    username,
    radiusToken,
    plan: (userData.plan_name || userData.package || '') as string,
    status: (userData.status || 'active') as string,
  })

  // 4. Set HTTP-only cookie and return success
  const response = NextResponse.json({
    ok: true,
    username,
    plan: userData.plan_name || userData.package || null,
    status: userData.status || 'active',
  })

  response.cookies.set({
    ...SESSION_COOKIE_OPTIONS,
    value: sessionToken,
  })

  return response
}
