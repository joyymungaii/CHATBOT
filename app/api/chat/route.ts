/**
 * app/api/chat/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Main chat API route. Protected — requires a valid session cookie.
 *
 * Orchestrates:
 *   1. Auth check     — verify session JWT from cookie
 *   2. PHP Radius     — customer account status, plan, session
 *   3. Smart OLT      — device online status, signal levels, disconnect history
 *   4. Firebase       — knowledge base articles, conversation logging
 *   5. Gemini         — generates the final response with full context
 *
 * Security:
 *   - Middleware already blocks unauthenticated requests
 *   - We double-check auth here for defence-in-depth
 *   - Username comes from the verified JWT — not from user input
 *   - No secrets are ever returned to the browser
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { buildCustomerContext } from '@/lib/buildContext'
import { logChatMessage } from '@/lib/firebase'
import { getSessionFromRequest } from '@/lib/auth'

// ── Gemini client (server-only) ───────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

// ── Base system instruction ───────────────────────────────────────────────────
const BASE_SYSTEM_INSTRUCTION = `You are a helpful customer support assistant for Nosteq Network, 
a WiFi internet service provider serving Kiambu and Nyahururu in Kenya.

Your role:
- Help customers with WiFi plans, coverage, pricing, installation, troubleshooting, and account support.
- When live customer data is provided below, use it to give specific, personalised answers.
- If a customer's account is suspended, explain this clearly and guide them to renew.
- If signal levels are critical, acknowledge the hardware issue and advise accordingly.
- If no session is active, note that the customer is not currently connected.
- Be friendly, concise, and professional.
- If a question is unrelated to internet or Nosteq services, politely redirect.

Response format:
- Keep responses short and actionable (2–4 sentences for simple issues).
- For complex issues, use a numbered list of steps.
- Never expose raw technical data (dBm values, session IDs) unless the customer asks.
- Translate technical findings into plain language (e.g. "Your signal is weak" not "RX: -31 dBm").`

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Validate Gemini API key
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error: Gemini API key not set.' },
      { status: 500 }
    )
  }

  // 2. Verify the user is logged in
  //    Middleware already blocks unauthenticated requests, but we double-check
  //    here so the username is guaranteed to come from a verified JWT.
  const session = await getSessionFromRequest(req)
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  // Username is from the verified session — not from user-supplied input
  const username = session.username

  // 3. Parse and validate request body
  let message: string
  let history: { sender: string; text: string }[]
  let sessionId: string

  try {
    const body = await req.json()
    message = body.message
    history = body.history || []
    sessionId = body.sessionId || `session_${Date.now()}`
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!message || typeof message !== 'string') {
    return NextResponse.json(
      { error: 'Message is required and must be a string.' },
      { status: 400 }
    )
  }

  // 4. Gather live customer context from all integrations (parallel, non-blocking)
  let customerContext = ''
  try {
    customerContext = await buildCustomerContext({ username, message })
  } catch (err) {
    console.warn('[Context] Failed to build customer context:', err)
  }

  // 5. Build the full system instruction (base + live customer data)
  const systemInstruction = BASE_SYSTEM_INSTRUCTION + customerContext

  // 6. Format chat history for Gemini
  //    Gemini requires history to start with a 'user' turn.
  type HistoryEntry = { role: 'user' | 'model'; parts: { text: string }[] }
  let formattedHistory: HistoryEntry[] = []

  if (Array.isArray(history) && history.length > 0) {
    const firstUserIdx = history.findIndex((m) => m.sender === 'user')
    if (firstUserIdx !== -1) {
      formattedHistory = history.slice(firstUserIdx).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }))
    }
  }

  // 7. Call Gemini
  let reply: string | undefined

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: { systemInstruction },
      history: formattedHistory,
    })

    const response = await chat.sendMessage({ message })
    reply = response.text
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('[Gemini API Error]', errMsg)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }

  if (!reply) {
    return NextResponse.json({ error: 'No response from Gemini.' }, { status: 500 })
  }

  // 8. Log the conversation to Firebase (non-blocking)
  logChatMessage({
    sessionId,
    userMessage: message,
    botReply: reply,
    username,
    integrationData: customerContext ? { contextLength: customerContext.length } : undefined,
  })

  // 9. Return the reply to the browser
  return NextResponse.json({ reply })
}
