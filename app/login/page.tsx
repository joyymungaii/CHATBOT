'use client'

/**
 * app/login/page.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Login page — the only public page in the app.
 * No registration. Users log in with their existing PHP Radius credentials.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          password 
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        setError(data.error || 'Login failed. Please check your credentials.')
        setIsLoading(false)
        return
      }

      // Login successful — redirect to home page
      router.push('/')
      
    } catch {
      setError('Unable to connect. Please check your internet connection.')
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #791115 0%, #094166 100%)' }}
    >
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Header banner */}
          <div
            className="px-8 py-6 text-white text-center"
            style={{ backgroundColor: '#791115' }}
          >
            {/* Logo */}
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30">
                <Image
                  src="/logo.jpg"
                  alt="Nosteq Network"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Nosteq Network</h1>
            <p className="text-sm opacity-80 mt-1">Customer Support Portal</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Sign in to your account</h2>
            <p className="text-sm text-gray-500 mb-6">
              Use your Nosteq account credentials to continue.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800
                             placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2
                             focus:border-transparent disabled:opacity-50 transition-shadow text-sm"
                  style={{ '--tw-ring-color': '#094166' } as React.CSSProperties}
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800
                             placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2
                             focus:border-transparent disabled:opacity-50 transition-shadow text-sm"
                  style={{ '--tw-ring-color': '#094166' } as React.CSSProperties}
                />
              </div>

              {/* Error message */}
              {error && (
                <div
                  className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
                  style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}
                  role="alert"
                >
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 text-white font-semibold rounded-xl
                           transition-all duration-150 active:scale-[0.98]
                           disabled:opacity-60 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2 text-sm"
                style={{ backgroundColor: '#094166' }}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-6">
              Don&apos;t have an account? Contact{' '}
              <span className="font-medium" style={{ color: '#791115' }}>
                Nosteq Network
              </span>{' '}
              to get connected.
            </p>
          </div>
        </div>

        <p className="text-center text-white/60 text-xs mt-4">
          &copy; {new Date().getFullYear()} Nosteq Network. All rights reserved.
        </p>
      </div>
    </div>
  )
}
