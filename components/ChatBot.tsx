'use client'

import { useState, useRef, useEffect } from 'react'
import { SendIcon, PlusIcon } from './Icons'

interface Message {
  id: string
  sender: 'user' | 'bot'
  text: string
  timestamp: Date
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Hello! How can I assist you today?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateBotReply = (userMessage: string): string => {
    const replies = [
      "That's an interesting question! Let me help you with that.",
      'I understand. Could you provide more details?',
      "Thanks for sharing. Here's what I think about that:",
      "I appreciate the context. Let me assist you further.",
      'Great question! This is something I can definitely help with.',
    ]
    return replies[Math.floor(Math.random() * replies.length)]
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate bot response delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: generateBotReply(trimmed),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
      setIsLoading(false)
    }, 500)
  }

  const handleNewChat = () => {
    setMessages([
      {
        id: '1',
        sender: 'bot',
        text: 'Hello! How can I assist you today?',
        timestamp: new Date(),
      },
    ])
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-primary text-white flex-col border-r border-muted">
        <div className="p-4 border-b border-white/20">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/90 rounded-lg transition-colors"
          >
            <PlusIcon />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            <div className="px-3 py-2 rounded-lg bg-white/10 text-sm cursor-pointer hover:bg-white/20 transition-colors">
              Recent Conversation
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-muted px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <button onClick={handleNewChat} className="p-2 hover:bg-muted rounded-lg">
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Chat Assistant</h1>
          </div>
          <div className="text-sm text-muted-foreground">Online</div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  message-bubble
                  ${
                    message.sender === 'user'
                      ? 'message-bubble-user'
                      : 'message-bubble-bot'
                  }
                `}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <span className={`text-xs mt-1 block ${
                  message.sender === 'user' 
                    ? 'text-white/70' 
                    : 'text-muted-foreground'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="message-bubble message-bubble-bot">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-muted bg-white px-4 md:px-6 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-input border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-all disabled:opacity-50"
              aria-label="Chat message input"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex items-center justify-center w-10 h-10 bg-secondary hover:bg-secondary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
