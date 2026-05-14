import { useState, useEffect, useRef } from 'react'
import { SendIcon, PlusIcon } from './Icons'

export default function ChatBot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(Date.now() - 60000),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateBotReply = (userMessage) => {
    const replies = [
      "That's interesting! Tell me more about that.",
      "I understand. How can I assist you further?",
      "Great question! Let me help you with that.",
      "I see. What else would you like to know?",
      "Thanks for sharing! Is there anything else I can help with?",
    ]
    return replies[Math.floor(Math.random() * replies.length)]
  }

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Simulate bot response delay
    setTimeout(() => {
      const botMessage = {
        id: messages.length + 2,
        text: generateBotReply(inputValue),
        sender: 'bot',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
      setIsLoading(false)
    }, 800)
  }

  const handleNewChat = () => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your AI assistant. How can I help you today?",
        sender: 'bot',
        timestamp: new Date(),
      },
    ])
    setInputValue('')
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 bg-primary text-white flex-col p-4">
        <button
          onClick={handleNewChat}
          className="flex items-center justify-center gap-2 w-full bg-secondary hover:bg-blue-500 text-white rounded-lg py-2 px-4 mb-6 transition-colors"
        >
          <PlusIcon />
          <span>New Chat</span>
        </button>
        <div className="flex-1 overflow-y-auto">
          <div className="text-sm text-gray-400 py-2">Chat History</div>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-700 transition-colors text-sm truncate">
              How to use AI?
            </button>
            <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-700 transition-colors text-sm truncate">
              JavaScript tips
            </button>
            <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-700 transition-colors text-sm truncate">
              Web design trends
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-muted bg-white px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg md:text-xl font-semibold text-foreground">Chat Assistant</h1>
            <button
              onClick={handleNewChat}
              className="md:hidden bg-secondary hover:bg-blue-500 text-white rounded-lg p-2 transition-colors"
            >
              <PlusIcon />
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-secondary text-white rounded-br-none'
                    : 'bg-muted text-foreground rounded-bl-none'
                }`}
              >
                <p className="text-sm md:text-base break-words">{message.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.sender === 'user'
                      ? 'text-blue-100'
                      : 'text-muted-foreground'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground px-4 py-2 rounded-lg rounded-bl-none flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></span>
                <span
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></span>
                <span
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-muted bg-white px-4 md:px-6 py-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 bg-muted border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent text-foreground placeholder-muted-foreground text-sm md:text-base"
            />
            <button
              onClick={handleSendMessage}
              disabled={inputValue.trim() === '' || isLoading}
              className="bg-secondary hover:bg-blue-500 disabled:bg-gray-400 text-white rounded-lg px-4 py-2 transition-colors flex items-center gap-2 disabled:cursor-not-allowed text-sm md:text-base"
            >
              <SendIcon />
              <span className="hidden md:inline">Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
