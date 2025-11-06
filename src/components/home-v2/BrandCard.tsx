/**
 * BrandCard - V1-branded card component
 *
 * Provides V1's card styling with correct shadows, borders, padding, and radius.
 * Use this for pricing cards, testimonials, and other content cards.
 */

import { brand } from './theme'

type BrandCardProps = {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'subtle'
  className?: string
  hover?: boolean
}

export function BrandCard({
  children,
  variant = 'default',
  className = '',
  hover = false,
}: BrandCardProps) {
  const baseClasses = 'bg-white border border-gray-100'

  const variantClasses = {
    default: `${brand.radii.card} ${brand.shadows.medium} p-8`,
    elevated: `${brand.radii.card} ${brand.shadows.extraLarge} p-8`,
    subtle: `${brand.radii.card} ${brand.shadows.subtle} p-6`,
  }

  const hoverClasses = hover
    ? 'hover:shadow-lg transition-shadow duration-300'
    : ''

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  )
}

type BrandCardHeaderProps = {
  children: React.ReactNode
  className?: string
}

export function BrandCardHeader({ children, className = '' }: BrandCardHeaderProps) {
  return <div className={`mb-6 ${className}`}>{children}</div>
}

type BrandCardTitleProps = {
  children: React.ReactNode
  className?: string
}

export function BrandCardTitle({ children, className = '' }: BrandCardTitleProps) {
  return (
    <h3 className={`text-2xl font-medium text-gray-900 ${className}`}>
      {children}
    </h3>
  )
}

type BrandCardContentProps = {
  children: React.ReactNode
  className?: string
}

export function BrandCardContent({ children, className = '' }: BrandCardContentProps) {
  return <div className={className}>{children}</div>
}
