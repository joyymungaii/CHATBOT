import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

// The API key is read from the server environment only.
// It is NEVER sent to the browser or included in the client bundle.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string.' },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: API key not set.' },
        { status: 500 }
      )
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      // System instruction scopes the AI to Nosteq Network support only
      systemInstruction: `You are a helpful customer support assistant for Nosteq Network, 
        a WiFi internet service provider serving Kiambu and Nyahururu in Kenya. 
        Help customers with questions about WiFi plans, coverage, pricing, installation, 
        troubleshooting, and account support. Be friendly, concise, and professional. 
        If a question is unrelated to internet or Nosteq services, politely redirect 
        the conversation back to how you can help with their connectivity needs.`,
    })

    // Build chat history from previous messages for context.
    // Gemini requires history to start with a 'user' turn and alternate
    // user → model → user → model. We filter out any leading bot messages
    // (like the initial greeting) to avoid an invalid history error.
    let formattedHistory: { role: string; parts: { text: string }[] }[] = []

    if (Array.isArray(history) && history.length > 0) {
      // Find the index of the first user message and slice from there
      const firstUserIdx = history.findIndex(
        (m: { sender: string }) => m.sender === 'user'
      )
      const trimmedHistory =
        firstUserIdx === -1 ? [] : history.slice(firstUserIdx)

      formattedHistory = trimmedHistory.map(
        (msg: { sender: string; text: string }) => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        })
      )
    }

    const chat = model.startChat({ history: formattedHistory })

    const result = await chat.sendMessage(message)
    const reply = result.response.text()

    return NextResponse.json({ reply })
  } catch (error) {
    // Log the full error on the server so we can see it in the terminal
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Gemini API Error]', message)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
