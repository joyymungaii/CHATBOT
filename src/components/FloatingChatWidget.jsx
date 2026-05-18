import { useState, useEffect, useRef } from 'react'
import { SendIcon } from './Icons'

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hey! How can I help you today?",
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

  const handleSendMessage = async () => {
  if (!inputValue.trim()) return

  const userMessage = {
    id: Date.now(),
    text: inputValue,
    sender: 'user',
    timestamp: new Date(),
  }

  // Add user message to chat
  setMessages((prev) => [...prev, userMessage])

  const currentInput = inputValue

  // Clear input
  setInputValue('')
  setIsLoading(true)

  try {
    // Send message to Gemini API route
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: currentInput,
      }),
    })

    const data = await response.json()

    // Add AI reply
    const botMessage = {
      id: Date.now() + 1,
      text: data.reply,
      sender: 'bot',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, botMessage])

  } catch (error) {
    console.error(error)

    // Error message
    const errorMessage = {
      id: Date.now() + 1,
      text: 'Sorry, something went wrong.',
      sender: 'bot',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, errorMessage])
  }

  setIsLoading(false)
}

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Chat Window */}
      <div
        className={`absolute bottom-20 right-0 transition-all duration-300 ease-out transform origin-bottom-right ${
          isOpen
            ? 'scale-100 opacity-100 visible'
            : 'scale-75 opacity-0 invisible'
        }`}
      >
        <div className="w-96 h-screen max-h-96 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border-2" style={{ borderColor: '#094166' }}>
          {/* Header */}
          <div className="text-white px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#791115' }}>
            <div>
              <h3 className="font-semibold text-base">Nosteq Network Support</h3>
              <p className="text-xs opacity-90">Fast WiFi for Kiambu & Nyahururu</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white rounded-full p-1 transition-colors hover:opacity-80"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
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
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.sender === 'user'
                      ? 'text-white rounded-br-none'
                      : 'bg-gray-100 text-foreground rounded-bl-none'
                  }`}
                  style={message.sender === 'user' ? { backgroundColor: '#094166' } : {}}
                >
                  <p className="break-words">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-foreground px-3 py-2 rounded-lg rounded-bl-none flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 bg-white px-3 py-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm text-foreground placeholder-gray-400"
                style={{ '--tw-ring-color': '#094166' }}
              />
              <button
                onClick={handleSendMessage}
                disabled={inputValue.trim() === '' || isLoading}
                className="text-white rounded-lg px-3 py-2 transition-colors flex items-center justify-center disabled:cursor-not-allowed disabled:bg-gray-300"
                style={{ 
                  backgroundColor: inputValue.trim() === '' || isLoading ? '#ccc' : '#094166',
                  cursor: inputValue.trim() === '' || isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Button */}
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: isOpen ? '#791115' : '#094166',
      }}
    >
      {isOpen ? (
        <span className="text-white text-xl font-bold">✕</span>
      ) : (
        <img
          src="src/assets/logo.jpg"
          alt="Chat"
          className="w-full h-full object-cover"
        />
      )}
    </button>
    </div>
  )
}
