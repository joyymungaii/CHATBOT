/**
 * lib/buildContext.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Orchestrates all integration calls and assembles a structured context block
 * that gets injected into the Gemini system prompt.
 *
 * Design principles:
 *  - Every integration is wrapped in try/catch — a single failing service
 *    never blocks the chat response.
 *  - All calls run in parallel (Promise.allSettled) to minimise latency.
 *  - Returns a plain string that Gemini can read as part of its system prompt.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getUserStatus, getCurrentSession } from './phpradius'
import { checkCustomerOnline, checkSignalLevels, getLastDisconnect } from './smartolt'
import { getKnowledgeBaseArticles } from './firebase'

export interface ContextInput {
  username?: string       // Radius username extracted from the conversation
  message: string         // The user's current message (used to pick KB articles)
}

/**
 * Detects whether a message is about a connectivity problem.
 * Used to decide whether to query OLT and Radius.
 */
function isConnectivityIssue(message: string): boolean {
  const lower = message.toLowerCase()
  const keywords = [
    'wifi', 'wi-fi', 'internet', 'down', 'slow', 'disconnected',
    'not working', 'no connection', 'signal', 'router', 'olt',
    'offline', 'reconnect', 'speed', 'buffering', 'dropping',
  ]
  return keywords.some((kw) => lower.includes(kw))
}

/**
 * Detects whether a message is about billing, plans, or account.
 */
function isAccountIssue(message: string): boolean {
  const lower = message.toLowerCase()
  const keywords = [
    'plan', 'package', 'billing', 'payment', 'expired', 'renew',
    'account', 'subscription', 'upgrade', 'downgrade', 'invoice',
  ]
  return keywords.some((kw) => lower.includes(kw))
}

/**
 * Builds a structured context string for Gemini.
 * All integration failures are handled gracefully — the function always
 * returns a string (possibly empty if no data was available).
 */
export async function buildCustomerContext(input: ContextInput): Promise<string> {
  const { username, message } = input
  const sections: string[] = []

  const needsConnectivity = isConnectivityIssue(message)
  const needsAccount = isAccountIssue(message) || needsConnectivity

  // ── Run all relevant queries in parallel ────────────────────────────────────
  const [
    userStatusResult,
    sessionResult,
    onlineResult,
    signalResult,
    disconnectResult,
    kbResult,
  ] = await Promise.allSettled([
    // Only query Radius if we have a username and it's relevant
    username && needsAccount
      ? getUserStatus(username)
      : Promise.resolve(null),

    username && needsConnectivity
      ? getCurrentSession(username)
      : Promise.resolve(null),

    username && needsConnectivity
      ? checkCustomerOnline(username)
      : Promise.resolve(null),

    username && needsConnectivity
      ? checkSignalLevels(username)
      : Promise.resolve(null),

    username && needsConnectivity
      ? getLastDisconnect(username)
      : Promise.resolve(null),

    // Always try to fetch relevant KB articles
    getKnowledgeBaseArticles(needsConnectivity ? 'connectivity' : 'general'),
  ])

  // ── PHP Radius: account status ───────────────────────────────────────────────
  if (userStatusResult.status === 'fulfilled' && userStatusResult.value?.success) {
    const u = userStatusResult.value.data!
    sections.push(`CUSTOMER ACCOUNT:
  Username: ${u.username}
  Status: ${u.status.toUpperCase()}
  Plan: ${u.plan}
  Expiry: ${u.expiry || 'N/A'}
  Last Seen: ${u.lastSeen || 'N/A'}
  IP Address: ${u.ipAddress || 'N/A'}`)
  }

  // ── PHP Radius: active session ───────────────────────────────────────────────
  if (sessionResult.status === 'fulfilled' && sessionResult.value?.success && sessionResult.value.data) {
    const s = sessionResult.value.data
    const dlMB = (s.downloadBytes / 1024 / 1024).toFixed(1)
    const ulMB = (s.uploadBytes / 1024 / 1024).toFixed(1)
    sections.push(`ACTIVE SESSION:
  Session ID: ${s.sessionId}
  Started: ${s.startTime}
  Downloaded: ${dlMB} MB
  Uploaded: ${ulMB} MB`)
  } else if (sessionResult.status === 'fulfilled' && username && needsConnectivity) {
    sections.push(`ACTIVE SESSION: None — customer is not currently connected`)
  }

  // ── Smart OLT: online status ─────────────────────────────────────────────────
  if (onlineResult.status === 'fulfilled' && onlineResult.value?.success) {
    const o = onlineResult.value.data!
    sections.push(`OLT DEVICE STATUS:
  Online: ${o.isOnline ? 'YES' : 'NO'}
  OLT: ${o.oltName || 'N/A'}
  Port: ${o.portName || 'N/A'}
  Last Seen: ${o.lastSeen || 'N/A'}`)
  }

  // ── Smart OLT: signal levels ─────────────────────────────────────────────────
  if (signalResult.status === 'fulfilled' && signalResult.value?.success) {
    const sig = signalResult.value.data!
    sections.push(`OPTICAL SIGNAL:
  RX Power: ${sig.rxPower} dBm (${sig.status.toUpperCase()})
  TX Power: ${sig.txPower} dBm
  Signal Quality: ${sig.status === 'good' ? 'Normal' : sig.status === 'warning' ? 'Degraded — may cause slowness' : sig.status === 'critical' ? 'CRITICAL — likely cause of outage' : 'Unknown'}`)
  }

  // ── Smart OLT: last disconnect ───────────────────────────────────────────────
  if (disconnectResult.status === 'fulfilled' && disconnectResult.value?.success && disconnectResult.value.data?.timestamp) {
    const d = disconnectResult.value.data
    sections.push(`LAST DISCONNECT:
  Time: ${d.timestamp}
  Reason: ${d.reason}
  Duration: ${d.duration || 'N/A'}`)
  }

  // ── Firebase: knowledge base articles ───────────────────────────────────────
  if (kbResult.status === 'fulfilled' && kbResult.value?.success && kbResult.value.data?.length) {
    const articles = kbResult.value.data
    const articleText = articles
      .map((a) => `  [${a.title}]: ${a.content}`)
      .join('\n')
    sections.push(`SUPPORT KNOWLEDGE BASE:\n${articleText}`)
  }

  if (sections.length === 0) {
    return '' // No context available — Gemini will answer from general knowledge
  }

  return `\n\n--- LIVE CUSTOMER DATA (use this to personalise your response) ---\n${sections.join('\n\n')}\n--- END CUSTOMER DATA ---`
}

/**
 * Attempts to extract a Radius username from the conversation.
 * Looks for patterns like "username: john123" or "my account is john123".
 * Returns undefined if no username is found — callers should handle gracefully.
 */
export function extractUsername(messages: { sender: string; text: string }[]): string | undefined {
  const patterns = [
    /username[:\s]+([a-z0-9._@-]+)/i,
    /account[:\s]+([a-z0-9._@-]+)/i,
    /my (?:account|username) is ([a-z0-9._@-]+)/i,
    /logged in as ([a-z0-9._@-]+)/i,
  ]

  // Search from most recent message backwards
  for (const msg of [...messages].reverse()) {
    for (const pattern of patterns) {
      const match = msg.text.match(pattern)
      if (match?.[1]) return match[1].toLowerCase()
    }
  }

  return undefined
}
