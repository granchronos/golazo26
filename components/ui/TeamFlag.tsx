'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

/**
 * Map our custom flag_codes to flagcdn.com compatible ISO codes.
 * Most are standard ISO 3166-1 alpha-2, but GB subdivisions need special handling.
 */
function getFlagUrl(flagCode: string, width: number = 40): string {
  // flagcdn uses w20/w40/w80/w160 for width-based images
  const w = width <= 20 ? 20 : width <= 40 ? 40 : width <= 80 ? 80 : 160

  // Handle British subdivisions (England, Scotland) — use Hatscripts/circle-flags on GitHub
  if (flagCode === 'gb-eng' || flagCode === 'gb-sct') {
    return `https://hatscripts.github.io/circle-flags/flags/${flagCode}.svg`
  }

  return `https://flagcdn.com/w${w}/${flagCode}.png`
}

interface TeamFlagProps {
  /** ISO alpha-2 flag code (e.g., 'mx', 'gb-eng') */
  flagCode: string
  /** Team name for alt text */
  name?: string
  /** Size in pixels (default: 20) */
  size?: number
  /** Additional className */
  className?: string
}

/**
 * Renders a flag image using CDN with emoji fallback.
 * Works consistently on all platforms (Windows, Mac, Linux, mobile).
 */
export function TeamFlag({ flagCode, name = '', size = 20, className }: TeamFlagProps) {
  const isSvg = flagCode === 'gb-eng' || flagCode === 'gb-sct'
  const url = getFlagUrl(flagCode, size)

  return (
    <Image
      src={url}
      alt={name}
      width={size}
      height={isSvg ? size : Math.round(size * 0.75)}
      className={cn('inline-block object-contain', isSvg && 'rounded-full', className)}
      unoptimized
    />
  )
}
