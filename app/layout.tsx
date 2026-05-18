import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nosteq Network | Fast WiFi for Kiambu & Nyahururu',
  description:
    'Nosteq Network provides lightning-fast and reliable WiFi connectivity across Kiambu and Nyahururu. Chat with our support team 24/7.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#791115',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
