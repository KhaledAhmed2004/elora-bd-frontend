import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  subtitle?: string
  href?: string
  linkLabel?: string
  className?: string
  children?: React.ReactNode
}

export function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel = "See All",
  className,
  children,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-5 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="font-display text-2xl font-bold md:text-3xl">{title}</h2>
        <span className="mt-1.5 block h-px w-14 bg-linear-to-r from-gold to-transparent" />
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        {children}
      </div>
      {href && (
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-1 text-sm font-medium text-gold-ink hover:underline"
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}
