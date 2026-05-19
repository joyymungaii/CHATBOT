'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { SendIcon, CloseIcon } from './Icons'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

// Quick-reply suggestion chips shown at the start of a conversation
const SUGGESTIONS = [
  'My WiFi is down',
  'Internet is slow',
  'I want installation',
  'Check available packages',
  'Router not connecting',
  'Talk to support',
  'Technician has not arrived',
  'Coverage in my area',
]

interface FloatingChatWidgetProps {
  username?: string
}

export default function FloatingChatWidget({ username }: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: username
        ? `Hey ${username}! I'm the Nosteq Network support assistant. How can I help you today?`
        : "Hey! I'm the Nosteq Network support assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ])
  // Show suggestions until the user sends their first message
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Stable session ID for this browser session (for Firebase logging)
  const sessionId = useRef(`session_${Date.now()}`)

  // Scroll to latest message whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // ── Core send logic (unchanged from original) ──────────────────────────────
  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    // Hide suggestions as soon as the user interacts
    setShowSuggestions(false)

    const userMessage: Message = {
      id: Date.now(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
    }

    // Snapshot history BEFORE adding the new user message
    const historyForApi = messages.map((m) => ({
      sender: m.sender,
      text: m.text,
    }))

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyForApi,
          sessionId: sessionId.current,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Server error ${response.status}`)
      }

      const botMessage: Message = {
        id: Date.now() + 1,
        text: data.reply,
        sender: 'bot',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Chat Error]', message)

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: `Error: ${message}`,
          sender: 'bot',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

  const handleSendMessage = () => sendMessage(inputValue)

  // Clicking a suggestion chip sends it directly as a message
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Reset suggestions when the user opens a fresh chat
  const handleOpen = () => {
    setIsOpen((prev) => !prev)
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    /*
     * Positioning wrapper — sits fixed in the bottom-right corner.
     * On mobile we pull it closer to the edge (bottom-4 right-4).
     * On desktop we give it more breathing room (bottom-6 right-6).
     */
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 font-sans">

      {/* ── Chat Window ─────────────────────────────────────────────────────── */}
      <div
        className={`absolute bottom-20 right-0 transition-all duration-300 ease-out transform origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 visible' : 'scale-75 opacity-0 invisible'
        }`}
        role="dialog"
        aria-label="Nosteq Network Support Chat"
        aria-modal="true"
      >
        {/*
         * Width strategy:
         *   mobile  (<sm) : calc(100vw - 2rem) so it never overflows the screen
         *   sm–md         : 26rem  (wider than the old w-96 = 24rem)
         *   lg+           : 30rem  (comfortable desktop reading width)
         * Height: taller on desktop (560px) to show more messages at once.
         */}
        <div
          className="flex flex-col overflow-hidden rounded-2xl shadow-2xl border-2"
          style={{
            borderColor: '#094166',
            width: 'min(calc(100vw - 2rem), 30rem)',
            height: 'clamp(480px, 75vh, 580px)',
          }}
        >

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div
            className="text-white px-5 py-4 flex items-center justify-between flex-shrink-0"
            style={{ backgroundColor: '#791115' }}
          >
            <div className="flex items-center gap-3">
              {/* Online status dot */}
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400" />
              </span>
              <div>
                {/* Increased from text-sm → text-base */}
                <h3 className="font-semibold text-base leading-tight">
                  Nosteq Network Support
                </h3>
                <p className="text-xs opacity-80 mt-0.5">
                  Fast WiFi · Kiambu &amp; Nyahururu
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white rounded-full p-1.5 hover:bg-white/20 transition-colors"
              aria-label="Close chat"
            >
              <CloseIcon />
            </button>
          </div>

          {/* ── Messages area ───────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-white">

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[82%] px-4 py-2.5 rounded-2xl ${
                    message.sender === 'user'
                      ? 'text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                  style={
                    message.sender === 'user'
                      ? { backgroundColor: '#094166' }
                      : {}
                  }
                >
                  {/* Increased from text-sm → text-[0.9rem] for readability */}
                  <p className="break-words leading-relaxed text-[0.9rem]">
                    {message.text}
                  </p>
                  <p
                    className={`text-[0.7rem] mt-1 ${
                      message.sender === 'user'
                        ? 'text-blue-200 text-right'
                        : 'text-gray-400'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator — unchanged */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            )}

            {/* ── Quick-reply suggestion chips ──────────────────────────────── */}
            {showSuggestions && !isLoading && (
              <div className="pt-1">
                <p className="text-xs text-gray-400 mb-2 px-1">
                  Quick options — tap to send:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs px-3 py-1.5 rounded-full border transition-all duration-150
                                 hover:text-white hover:shadow-sm active:scale-95 focus:outline-none
                                 focus:ring-2 focus:ring-offset-1"
                      style={{
                        borderColor: '#094166',
                        color: '#094166',
                        backgroundColor: 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#094166'
                        e.currentTarget.style.color = '#ffffff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#094166'
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input bar ───────────────────────────────────────────────────── */}
          <div className="border-t border-gray-200 bg-white px-4 py-3 flex-shrink-0">
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={isLoading}
                aria-label="Chat message"
                /* Increased from text-sm → text-[0.9rem] */
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                           text-[0.9rem] text-gray-800 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:border-transparent
                           disabled:opacity-50 transition-shadow"
                style={{ '--tw-ring-color': '#094166' } as React.CSSProperties}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                aria-label="Send message"
                /* Slightly larger button: p-2.5 instead of p-2 */
                className="text-white rounded-xl p-2.5 transition-all duration-150
                           flex items-center justify-center
                           disabled:cursor-not-allowed active:scale-95"
                style={{
                  backgroundColor:
                    !inputValue.trim() || isLoading ? '#9ca3af' : '#094166',
                }}
              >
                <SendIcon />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Floating Toggle Button ──────────────────────────────────────────── */}
      <button
        onClick={handleOpen}
        aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
        aria-expanded={isOpen}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center
                   overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95"
        style={{ backgroundColor: isOpen ? '#791115' : '#094166' }}
      >
        {isOpen ? (
          <CloseIcon />
        ) : (
          <Image
            src="/logo.jpg"
            alt="Nosteq Network"
            width={56}
            height={56}
            className="w-full h-full object-cover"
          />
        )}
      </button>

    </div>
  )
}
