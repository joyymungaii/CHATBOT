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

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hey! I'm the Nosteq Network support assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const handleSendMessage = async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = {
      id: Date.now(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
    }

    // Snapshot history BEFORE adding the new user message
    // (we send previous messages as context to the API)
    const historyForApi = messages.map((m) => ({
      sender: m.sender,
      text: m.text,
    }))

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // POST to our secure Next.js API route — API key never leaves the server
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyForApi,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Surface the real server error message to the user
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

      const errorMessage: Message = {
        id: Date.now() + 1,
        // Show the actual error so we can diagnose it
        text: `Error: ${message}`,
        sender: 'bot',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Chat Window */}
      <div
        className={`absolute bottom-20 right-0 transition-all duration-300 ease-out transform origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 visible' : 'scale-75 opacity-0 invisible'
        }`}
        role="dialog"
        aria-label="Nosteq Network Support Chat"
        aria-modal="true"
      >
        <div
          className="w-80 sm:w-96 flex flex-col overflow-hidden rounded-xl shadow-2xl border-2"
          style={{ borderColor: '#094166', height: '480px' }}
        >
          {/* Header */}
          <div
            className="text-white px-4 py-3 flex items-center justify-between flex-shrink-0"
            style={{ backgroundColor: '#791115' }}
          >
            <div>
              <h3 className="font-semibold text-sm">Nosteq Network Support</h3>
              <p className="text-xs opacity-80">Fast WiFi · Kiambu & Nyahururu</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white rounded-full p-1 hover:opacity-75 transition-opacity"
              aria-label="Close chat"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    message.sender === 'user'
                      ? 'text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                  style={
                    message.sender === 'user'
                      ? { backgroundColor: '#094166' }
                      : {}
                  }
                >
                  <p className="break-words leading-relaxed">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-3 rounded-lg rounded-bl-none flex gap-1 items-center">
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

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 bg-white px-3 py-3 flex-shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={isLoading}
                aria-label="Chat message"
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50"
                style={{ '--tw-ring-color': '#094166' } as React.CSSProperties}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                aria-label="Send message"
                className="text-white rounded-lg px-3 py-2 transition-colors flex items-center justify-center disabled:cursor-not-allowed"
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

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
        aria-expanded={isOpen}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center overflow-hidden transition-colors duration-200"
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
