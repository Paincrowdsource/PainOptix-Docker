import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { ClientProvider } from '@/src/components/ClientProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PainOptix - Personalized Back Pain Assessment',
  description: 'Get personalized educational guides for back pain based on your symptoms. Clinically validated assessment designed by Bradley W. Carpentier, MD.',
  keywords: 'back pain, assessment, diagnosis, sciatica, lumbar pain, spine health, medical education',
  authors: [{ name: 'Bradley W. Carpentier, MD' }],
  creator: 'PainOptix',
  publisher: 'PainOptix',
  openGraph: {
    title: 'PainOptix - Personalized Back Pain Assessment',
    description: 'Get personalized educational guides for back pain based on your symptoms. Clinically validated assessment tool.',
    type: 'website',
    locale: 'en_US',
    url: 'https://painoptix.com',
    siteName: 'PainOptix',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PainOptix - Back Pain Assessment',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PainOptix - Personalized Back Pain Assessment',
    description: 'Get personalized educational guides for back pain based on your symptoms.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
      <head>
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && process.env.NEXT_PUBLIC_GA_ID !== 'G-XXXXXXXXXX' && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body className={inter.className}>
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  )
}