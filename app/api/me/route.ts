/**
 * app/api/me/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Returns the currently logged-in user's profile.
 * Used by the frontend to check auth state on page load.
 *
 * Returns:
 *   200 { username, plan, status }   — if logged in
 *   401 { error }                    — if not logged in / token expired
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  // Return safe user data — never return radiusToken to the browser
  return NextResponse.json({
    username: session.username,
    plan: session.plan || null,
    status: session.status || 'active',
  })
}
