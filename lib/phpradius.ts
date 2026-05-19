/**
 * lib/phpradius.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-side utility for PHP Radius API.
 * All credentials are read from environment variables — never exposed to the
 * browser. This file is only ever imported inside Next.js API routes (server).
 *
 * Environment variables required in .env.local:
 *   PHPRADIUS_BASE_URL   e.g. https://devs1.phpradius.com
 *   PHPRADIUS_USERNAME
 *   PHPRADIUS_PASSWORD
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BASE_URL = (process.env.PHPRADIUS_BASE_URL || 'https://devs1.phpradius.com').replace(/\/$/, '')

// ── Types ────────────────────────────────────────────────────────────────────

export interface RadiusUserStatus {
  username: string
  status: 'active' | 'suspended' | 'expired' | 'unknown'
  plan: string
  expiry: string
  lastSeen: string
  ipAddress: string
}

export interface RadiusSession {
  sessionId: string
  startTime: string
  downloadBytes: number
  uploadBytes: number
  nasIp: string
}

export interface RadiusResult<T> {
  success: boolean
  data?: T
  error?: string
}

// ── Token cache (in-memory, server process lifetime) ─────────────────────────
// In production with multiple instances, move this to Redis or a DB.
let cachedToken: string | null = null
let tokenExpiry: number = 0

// ── Login / token management ─────────────────────────────────────────────────

/**
 * Authenticates with PHP Radius and returns a bearer token.
 * Caches the token for 50 minutes to avoid hammering the auth endpoint.
 */
export async function login(): Promise<string> {
  // Return cached token if still valid (with 5-min buffer)
  if (cachedToken && Date.now() < tokenExpiry - 5 * 60 * 1000) {
    return cachedToken
  }

  const username = process.env.PHPRADIUS_USERNAME
  const password = process.env.PHPRADIUS_PASSWORD

  if (!username || !password) {
    throw new Error('PHP Radius credentials not configured (PHPRADIUS_USERNAME / PHPRADIUS_PASSWORD)')
  }

  const res = await fetch(`${BASE_URL}/index.php/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!res.ok) {
    throw new Error(`PHP Radius login failed: ${res.status} ${res.statusText}`)
  }

  const json = await res.json()

  // PHP Radius returns token in different fields depending on version
  const token: string = json.token || json.access_token || json.data?.token
  if (!token) {
    throw new Error('PHP Radius login response did not contain a token')
  }

  cachedToken = token
  tokenExpiry = Date.now() + 50 * 60 * 1000 // cache for 50 minutes
  return token
}

// ── Authenticated request helper ─────────────────────────────────────────────

async function radiusGet(path: string): Promise<unknown> {
  const token = await login()
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`PHP Radius request failed: ${res.status} ${path}`)
  }

  return res.json()
}

// ── Public methods ────────────────────────────────────────────────────────────

/**
 * Returns the account status and plan for a given username.
 * username: the customer's Radius username (e.g. their phone number or account ID)
 */
export async function getUserStatus(username: string): Promise<RadiusResult<RadiusUserStatus>> {
  try {
    const data = await radiusGet(`/index.php/api/customers/${encodeURIComponent(username)}`) as Record<string, unknown>

    return {
      success: true,
      data: {
        username,
        status: (data.status as string)?.toLowerCase() as RadiusUserStatus['status'] || 'unknown',
        plan: (data.plan_name || data.package || 'Unknown') as string,
        expiry: (data.expiry_date || data.expiration || '') as string,
        lastSeen: (data.last_seen || data.last_login || '') as string,
        ipAddress: (data.ip_address || data.framedipaddress || '') as string,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user status',
    }
  }
}

/**
 * Returns the customer's current active plan details.
 */
export async function getUserPlan(username: string): Promise<RadiusResult<Record<string, unknown>>> {
  try {
    const data = await radiusGet(`/index.php/api/customers/${encodeURIComponent(username)}/plan`) as Record<string, unknown>
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user plan',
    }
  }
}

/**
 * Returns the customer's current active session (if any).
 */
export async function getCurrentSession(username: string): Promise<RadiusResult<RadiusSession>> {
  try {
    const data = await radiusGet(`/index.php/api/sessions/active/${encodeURIComponent(username)}`) as Record<string, unknown>

    return {
      success: true,
      data: {
        sessionId: (data.session_id || data.acct_session_id || '') as string,
        startTime: (data.start_time || data.acctstarttime || '') as string,
        downloadBytes: Number(data.download_bytes || data.acctinputoctets || 0),
        uploadBytes: Number(data.upload_bytes || data.acctoutputoctets || 0),
        nasIp: (data.nas_ip || data.nasipaddress || '') as string,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch current session',
    }
  }
}
