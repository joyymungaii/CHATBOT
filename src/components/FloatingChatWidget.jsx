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

  const generateBotReply = (userMessage) => {
    const replies = [
      "Thanks for reaching out! How can we help you with your internet needs?",
      "Great question! We have fast WiFi coverage in Kiambu and Nyahururu. What would you like to know?",
      "We're here to help! Are you interested in our high-speed WiFi services?",
      "Excellent! Let me know if you have any questions about our WiFi plans in your area.",
      "Thanks for chatting with us! Is there anything else about our services you'd like to know?",
    ]
    return replies[Math.floor(Math.random() * replies.length)]
  }

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return

    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

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
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center text-white font-semibold text-2xl scale-100`}
        style={{
          backgroundColor: isOpen ? '#791115' : '#094166'
        }}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.656 17.008a9.993 9.993 0 10-14.85-3.7c1.02-1.357 2.08-2.693 3.188-3.996a5.991 5.991 0 0111.234 6.08.948.948 0 01-1.084.595c-.822-.247-1.644-.48-2.453-.704a9.42 9.42 0 00-9.3 13.5.942.942 0 00.833.67c.798.087 1.595.165 2.39.242 6.554.767 13.048-2.823 16.611-8.878a.953.953 0 00-.223-1.251z" />
          </svg>
        )}
      </button>
    </div>
  )
}
