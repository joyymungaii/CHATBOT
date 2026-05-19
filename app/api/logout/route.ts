/**
 * app/api/logout/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Clears the session cookie, effectively logging the user out.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server'
import { SESSION_COOKIE_OPTIONS } from '@/lib/auth'

export async function POST() {
  const response = NextResponse.json({ ok: true })

  // Overwrite the cookie with an expired one to delete it
  response.cookies.set({
    ...SESSION_COOKIE_OPTIONS,
    value: '',
    maxAge: 0,
  })

  return response
}
