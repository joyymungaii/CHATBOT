import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

// API key is server-only — never exposed to the browser
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

const SYSTEM_INSTRUCTION = `You are a helpful customer support assistant for Nosteq Network, 
a WiFi internet service provider serving Kiambu and Nyahururu in Kenya. 
Help customers with questions about WiFi plans, coverage, pricing, installation, 
troubleshooting, and account support. Be friendly, concise, and professional. 
If a question is unrelated to internet or Nosteq services, politely redirect 
the conversation back to how you can help with their connectivity needs.`

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: API key not set.' },
        { status: 500 }
      )
    }

    const { message, history } = await req.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string.' },
        { status: 400 }
      )
    }

    // Build chat history for context.
    // The new SDK uses { role, parts: [{ text }] } format.
    // Gemini requires history to start with a 'user' turn — we strip any
    // leading bot messages (e.g. the initial greeting) to avoid API errors.
    type HistoryEntry = { role: 'user' | 'model'; parts: { text: string }[] }
    let formattedHistory: HistoryEntry[] = []

    if (Array.isArray(history) && history.length > 0) {
      const firstUserIdx = history.findIndex(
        (m: { sender: string }) => m.sender === 'user'
      )
      if (firstUserIdx !== -1) {
        formattedHistory = history
          .slice(firstUserIdx)
          .map((msg: { sender: string; text: string }) => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
          }))
      }
    }

    // Start a chat session with history and system instruction
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: formattedHistory,
    })

    const response = await chat.sendMessage({ message })
    const reply = response.text

    if (!reply) {
      return NextResponse.json(
        { error: 'No response from Gemini.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reply })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Gemini API Error]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
