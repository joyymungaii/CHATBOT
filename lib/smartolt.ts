/**
 * lib/smartolt.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-side integration layer for Smart OLT.
 * All credentials are read from environment variables — never exposed to the
 * browser. This file is only ever imported inside Next.js API routes (server).
 *
 * Environment variables required in .env.local:
 *   SMARTOLT_BASE_URL   e.g. https://your-smartolt-instance.com
 *   SMARTOLT_API_KEY
 *
 * NOTE: Smart OLT API endpoints vary by deployment. The paths below follow the
 * common Smart OLT REST API pattern. Adjust endpoint paths to match your
 * specific Smart OLT version if needed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BASE_URL = (process.env.SMARTOLT_BASE_URL || '').replace(/\/$/, '')

// ── Types ────────────────────────────────────────────────────────────────────

export interface OltOnlineStatus {
  isOnline: boolean
  macAddress: string
  oltName: string
  portName: string
  lastSeen: string
}

export interface OltSignalLevels {
  rxPower: number   // Received optical power in dBm
  txPower: number   // Transmitted optical power in dBm
  temperature: number
  voltage: number
  status: 'good' | 'warning' | 'critical' | 'unknown'
}

export interface OltDisconnectEvent {
  timestamp: string
  reason: string
  duration: string // how long the disconnect lasted
}

export interface OltResult<T> {
  success: boolean
  data?: T
  error?: string
}

// ── Authenticated request helper ─────────────────────────────────────────────

async function oltGet(path: string): Promise<unknown> {
  const apiKey = process.env.SMARTOLT_API_KEY

  if (!BASE_URL) {
    throw new Error('SMARTOLT_BASE_URL is not configured')
  }
  if (!apiKey) {
    throw new Error('SMARTOLT_API_KEY is not configured')
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'X-API-Key': apiKey,
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`Smart OLT request failed: ${res.status} ${path}`)
  }

  return res.json()
}

// ── Public methods ────────────────────────────────────────────────────────────

/**
 * Checks whether a customer's ONT/ONU device is currently online.
 * identifier: MAC address, serial number, or customer username depending on
 *             your Smart OLT configuration.
 */
export async function checkCustomerOnline(identifier: string): Promise<OltResult<OltOnlineStatus>> {
  // ── PLACEHOLDER ──────────────────────────────────────────────────────────
  // Replace the path below with your actual Smart OLT endpoint.
  // Common patterns:
  //   /api/v1/onus/search?mac={mac}
  //   /api/v1/customers/{id}/onu/status
  // ─────────────────────────────────────────────────────────────────────────
  if (!process.env.SMARTOLT_BASE_URL || !process.env.SMARTOLT_API_KEY) {
    return {
      success: false,
      error: 'Smart OLT credentials not configured — skipping OLT check',
    }
  }

  try {
    const data = await oltGet(`/api/v1/onus/status?identifier=${encodeURIComponent(identifier)}`) as Record<string, unknown>

    return {
      success: true,
      data: {
        isOnline: Boolean(data.online || data.is_online),
        macAddress: (data.mac_address || data.mac || '') as string,
        oltName: (data.olt_name || data.olt || '') as string,
        portName: (data.port_name || data.port || '') as string,
        lastSeen: (data.last_seen || '') as string,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check OLT status',
    }
  }
}

/**
 * Returns the optical signal levels for a customer's ONT device.
 * Good RX power range is typically -8 to -27 dBm.
 * Below -27 dBm indicates a signal problem.
 */
export async function checkSignalLevels(identifier: string): Promise<OltResult<OltSignalLevels>> {
  if (!process.env.SMARTOLT_BASE_URL || !process.env.SMARTOLT_API_KEY) {
    return {
      success: false,
      error: 'Smart OLT credentials not configured — skipping signal check',
    }
  }

  try {
    const data = await oltGet(`/api/v1/onus/signal?identifier=${encodeURIComponent(identifier)}`) as Record<string, unknown>

    const rxPower = Number(data.rx_power || data.rxPower || 0)

    // Classify signal quality
    let status: OltSignalLevels['status'] = 'unknown'
    if (rxPower !== 0) {
      if (rxPower >= -27) status = 'good'
      else if (rxPower >= -30) status = 'warning'
      else status = 'critical'
    }

    return {
      success: true,
      data: {
        rxPower,
        txPower: Number(data.tx_power || data.txPower || 0),
        temperature: Number(data.temperature || 0),
        voltage: Number(data.voltage || 0),
        status,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch signal levels',
    }
  }
}

/**
 * Returns the most recent disconnect event for a customer's ONT.
 * Useful for diagnosing intermittent connectivity issues.
 */
export async function getLastDisconnect(identifier: string): Promise<OltResult<OltDisconnectEvent>> {
  if (!process.env.SMARTOLT_BASE_URL || !process.env.SMARTOLT_API_KEY) {
    return {
      success: false,
      error: 'Smart OLT credentials not configured — skipping disconnect history',
    }
  }

  try {
    const data = await oltGet(`/api/v1/onus/events?identifier=${encodeURIComponent(identifier)}&type=disconnect&limit=1`) as Record<string, unknown>

    // Handle both array and single-object responses
    const event = Array.isArray(data) ? data[0] : (data.events as unknown[])?.[0] || data

    if (!event) {
      return { success: true, data: { timestamp: '', reason: 'No disconnect events found', duration: '' } }
    }

    const e = event as Record<string, unknown>
    return {
      success: true,
      data: {
        timestamp: (e.timestamp || e.event_time || '') as string,
        reason: (e.reason || e.cause || 'Unknown') as string,
        duration: (e.duration || '') as string,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch disconnect history',
    }
  }
}
