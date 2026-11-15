import Image from "next/image"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

import logo from "../../../public/brand/elora-logo.png"

export interface LogoProps {
  className?: string
  onClick?: () => void
  /** "Fashion & Lifestyle" under the logo, between gold rules (footer) */
  showTagline?: boolean
  size?: "sm" | "md" | "lg"
  /** Load immediately — only for the copy that is above the fold (header) */
  eager?: boolean
}

/** The client's official logo (transparent PNG), used exactly as supplied. */
export function Logo({
  className,
  onClick,
  showTagline = false,
  size = "md",
  eager = false,
}: LogoProps) {
  const heights = {
    sm: "h-10",
    md: "h-11 sm:h-13",
    lg: "h-20",
  }[size]

  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label={`${siteConfig.name} — Home`}
      className={cn(
        "group inline-flex shrink-0 flex-col items-center select-none",
        className
      )}
    >
      <Image
        src={logo}
        alt={siteConfig.name}
        sizes="200px"
        loading={eager ? "eager" : "lazy"}
        className={cn(
          "w-auto transition-transform duration-300 group-hover:scale-[1.03]",
          heights
        )}
      />
      {showTagline && (
        <span className="mt-1.5 flex items-center gap-2">
          <span className="h-px w-6 bg-gold/60" />
          <span className="font-display text-xs font-semibold text-cocoa italic">
            Fashion &amp; Lifestyle
          </span>
          <span className="h-px w-6 bg-gold/60" />
        </span>
      )}
    </Link>
  )
}
