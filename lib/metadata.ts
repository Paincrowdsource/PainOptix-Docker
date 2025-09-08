import { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://painoptix.com'

export const siteMetadata = {
  title: 'PainOptix',
  description: 'The wrong treatment can make pain worse. The right one can help recovery. Discover your pain pattern - disc, joint, muscle, or nerve - it matters.',
  url: baseUrl,
  image: `${baseUrl}/og-image.jpg`,
  twitter: '@DrCPainMD',
  siteName: 'PainOptix',
}

export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'PainOptix - Personalized Back Pain Assessment',
    template: '%s | PainOptix'
  },
  description: siteMetadata.description,
  openGraph: {
    title: 'PainOptix - Personalized Back Pain Assessment',
    description: siteMetadata.description,
    url: siteMetadata.url,
    siteName: siteMetadata.siteName,
    images: [
      {
        url: siteMetadata.image,
        width: 1200,
        height: 630,
        alt: 'PainOptix - Personalized Back Pain Assessment',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PainOptix - Personalized Back Pain Assessment',
    description: siteMetadata.description,
    site: siteMetadata.twitter,
    creator: siteMetadata.twitter,
    images: [siteMetadata.image],
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
}

export const pageMetadata = {
  home: {
    title: 'PainOptix - Personalized Back Pain Assessment',
    description: 'The wrong treatment can make pain worse. The right one can help recovery. Discover your pain pattern - disc, joint, muscle, or nerve - it matters.',
  },
  assessment: {
    title: 'Back Pain Assessment',
    description: 'Take our personalized assessment to identify your specific pain pattern and get targeted treatment recommendations.',
  },
  results: {
    title: 'Your Pain Analysis Results',
    description: 'Your personalized back pain analysis and treatment recommendations based on evidence-based diagnostic patterns.',
  },
  comprehensiveCare: {
    title: 'Comprehensive Care Program',
    description: 'Get personalized, ongoing support for your back pain recovery with expert guidance and targeted treatment plans.',
  },
}