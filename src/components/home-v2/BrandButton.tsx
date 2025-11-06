/**
 * BrandButton - V1-branded CTA button
 *
 * Matches V1's exact button styling with brand colors, hover effects, and scale transforms.
 * Use this instead of shadcn Button for brand-critical CTAs.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { brand } from './theme'

type BrandButtonProps = {
  children: React.ReactNode
  href?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  showIcon?: boolean
  variant?: 'primary' | 'secondary'
  className?: string
}

export function BrandButton({
  children,
  href,
  onClick,
  disabled = false,
  showIcon = true,
  variant = 'primary',
  className = '',
}: BrandButtonProps) {
  const baseClasses = variant === 'primary'
    ? `${brand.button.primary.base} ${brand.button.primary.hover} ${brand.button.primary.active} ${brand.button.primary.transition}`
    : `${brand.button.secondary.base} ${brand.button.secondary.hover} ${brand.button.secondary.transition}`

  const combinedClasses = `${baseClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`

  // If href is provided, render as Link
  if (href && !disabled) {
    return (
      <Link href={href} className={combinedClasses}>
        {children}
        {showIcon && variant === 'primary' && (
          <ArrowRight className="inline-block ml-2 w-5 h-5" />
        )}
      </Link>
    )
  }

  // Otherwise render as button
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
    >
      {children}
      {showIcon && variant === 'primary' && (
        <ArrowRight className="inline-block ml-2 w-5 h-5" />
      )}
    </button>
  )
}
