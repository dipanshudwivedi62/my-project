import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'FieldTrace — Digital Field Drug-Test Verification',
  description:
    'Capture colorimetric field drug tests, classify them with calibrated image analysis, and seal every result with a tamper-evident, signed evidence record.',
}

export const viewport: Viewport = {
  themeColor: '#0a0e13',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  )
}
