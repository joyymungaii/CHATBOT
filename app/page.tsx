/**
 * app/page.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Main page — protected by middleware.
 * Reads the session server-side to display the logged-in user's name.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import FloatingChatWidget from '@/components/FloatingChatWidget'
import LogoutButton from '@/components/LogoutButton'

export default async function Home() {
  // Server-side auth check — middleware handles the redirect, but this
  // gives us the session data to display the username in the header.
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="text-white py-6 shadow-md" style={{ backgroundColor: '#791115' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Nosteq Network</h1>
            <p className="text-lg mt-1 opacity-90">Fast &amp; Reliable WiFi for Kiambu &amp; Nyahururu</p>
          </div>
          {/* User info + logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{session.username}</p>
              {session.planId && (
                <p className="text-xs opacity-75">Plan ID: {session.planId}</p>
              )}
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        {/* Hero Section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#791115' }}>
            Welcome back, {session.username}
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            At Nosteq Network, we provide lightning-fast and reliable WiFi connectivity across
            Kiambu and Nyahururu. Our dedicated support team is available 24/7 through our
            intelligent chatbot to answer all your questions and help you get connected.
          </p>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-white rounded-lg shadow-md" style={{ borderLeft: '4px solid #094166' }}>
            <h3 className="text-xl font-semibold mb-3" style={{ color: '#791115' }}>
              Lightning-Fast Speed
            </h3>
            <p className="text-gray-600">
              Enjoy blazing-fast internet speeds perfect for streaming, gaming, and working from home.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md" style={{ borderLeft: '4px solid #094166' }}>
            <h3 className="text-xl font-semibold mb-3" style={{ color: '#791115' }}>
              Wide Coverage
            </h3>
            <p className="text-gray-600">
              Reliable WiFi coverage throughout Kiambu and Nyahururu, wherever you need it.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md" style={{ borderLeft: '4px solid #094166' }}>
            <h3 className="text-xl font-semibold mb-3" style={{ color: '#791115' }}>
              24/7 Support
            </h3>
            <p className="text-gray-600">
              Our dedicated support team is always here to help through chat, phone, or email.
            </p>
          </div>
        </section>

        {/* Call to Action */}
        <section
          className="text-white p-8 rounded-lg shadow-lg"
          style={{ background: 'linear-gradient(to right, #791115, #094166)' }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Need Help with WiFi?</h2>
          <p className="text-lg mb-6">
            Have questions about your service, coverage, or plan? Click the chat button in
            the bottom-right corner to chat with our AI support assistant.
          </p>
          <button className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
            Start Chatting Now
          </button>
        </section>

        {/* FAQ Section */}
        <section className="mt-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: '#791115' }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="p-4 bg-white rounded-lg shadow-md cursor-pointer">
              <summary className="font-semibold" style={{ color: '#791115' }}>
                What areas do you cover?
              </summary>
              <p className="text-gray-600 mt-2">
                Nosteq Network provides high-speed WiFi coverage throughout Kiambu and Nyahururu.
                Check our coverage map or chat with our team to see if your area is covered.
              </p>
            </details>
            <details className="p-4 bg-white rounded-lg shadow-md cursor-pointer">
              <summary className="font-semibold" style={{ color: '#791115' }}>
                How fast is your WiFi?
              </summary>
              <p className="text-gray-600 mt-2">
                Our network offers lightning-fast speeds designed for streaming, gaming, and
                professional work. Actual speeds may vary based on your location and plan.
              </p>
            </details>
            <details className="p-4 bg-white rounded-lg shadow-md cursor-pointer">
              <summary className="font-semibold" style={{ color: '#791115' }}>
                How do I get connected?
              </summary>
              <p className="text-gray-600 mt-2">
                Contact our support team through the chat widget to learn about available plans,
                pricing, and installation in your area. We&apos;ll get you connected quickly!
              </p>
            </details>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-white py-8 mt-12" style={{ backgroundColor: '#791115' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <h3 className="text-xl font-bold mb-2">Nosteq Network</h3>
          <p className="opacity-90 mb-4">Fast WiFi for Kiambu &amp; Nyahururu</p>
          <p className="text-sm opacity-75">&copy; 2024 Nosteq Network. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating Chat Widget */}
      <FloatingChatWidget username={session.username} />
    </div>
  )
}
