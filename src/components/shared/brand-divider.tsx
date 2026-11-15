import { cn } from "@/lib/utils"

/** Hanger with a heart — the small motif under the ELORA wordmark */
export function HangerHeart({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <path d="M21 6.5a3 3 0 1 1 4.2 2.75c-.75.33-1.2 1-1.2 1.8V12" />
      <path d="M24 12 3 24.5h42L24 12Z" />
      <path d="M24 22.2s-3.2-1.9-3.2-3.9a1.6 1.6 0 0 1 3.2-.5 1.6 1.6 0 0 1 3.2.5c0 2-3.2 3.9-3.2 3.9Z" />
    </svg>
  )
}

/** Gold line — hanger — gold line, echoing the logo's tagline rules */
export function BrandDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 text-gold", className)}>
      <span className="gold-rule flex-1" />
      <HangerHeart className="h-5 w-9" />
      <span className="gold-rule flex-1" />
    </div>
  )
}
