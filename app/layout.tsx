import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClientProvider } from '@/src/components/ClientProvider'
import GoogleAnalytics from '@/src/components/GoogleAnalytics'
import { defaultMetadata } from '@/lib/metadata'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  ...defaultMetadata,
  keywords: 'back pain, assessment, diagnosis, sciatica, lumbar pain, spine health, medical education, disc pain, facet joint, muscle pain, nerve pain',
  authors: [{ name: 'Bradley W. Carpentier, MD' }],
  creator: 'PainOptix',
  publisher: 'PainOptix',
  verification: {
    google: 'your-google-verification-code',
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
        {/* Google Analytics - Hardcoded ID works on DigitalOcean */}
        <GoogleAnalytics />
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  )
}