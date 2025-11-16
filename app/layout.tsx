import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { PageTransition } from '@/components/PageTransition'
import CallNotification from '@/components/CallNotification'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Queldo - Skill Share Marketplace for Students',
  description: 'Connect with students, share skills, and learn together. A platform where young learners trade skills and grow together.',
  keywords: ['skill sharing', 'student platform', 'peer learning', 'skill trading', 'education', 'students'],
  authors: [{ name: 'Queldo Team' }],
  openGraph: {
    title: 'Queldo - Skill Share Marketplace',
    description: 'Connect with students, share skills, and learn together',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Queldo - Skill Share Marketplace',
    description: 'Connect with students, share skills, and learn together',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: '#9333ea',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
      return (
        <html lang="en">
          <body className={inter.className}>
            <PageTransition>
              {children}
            </PageTransition>
            <CallNotification />
            <Toaster 
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1a1a2e',
                  color: '#fff',
                  border: '1px solid rgba(147, 51, 234, 0.3)',
                },
                duration: 3000,
              }}
            />
          </body>
        </html>
      )
}

