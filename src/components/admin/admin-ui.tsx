import { ChevronLeft, ChevronRight } from "lucide-react"

import { STATUS_STYLE } from "@/components/account/order-card"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/types"

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-heading text-2xl font-bold">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}

/**
 * Admin-facing status names. STATUS_STYLE labels are shared with the customer
 * account page (storefront copy), so the admin overrides them here.
 */
export const ADMIN_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Packing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
}

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus
  className?: string
}) {
  const s = STATUS_STYLE[status]
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        s.className,
        className
      )}
    >
      {ADMIN_STATUS_LABEL[status]}
    </span>
  )
}

export const PAYMENT_LABEL = {
  cod: "COD",
  bkash: "bKash",
  nagad: "Nagad",
  sslcommerz: "Card",
} as const

/** Error box with a retry button for failed admin queries */
export function QueryError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm">
      <p className="font-medium text-destructive">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

/** Previous / next for lists paged by the API */
export function Pager({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number
  totalPages: number
  total: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="mt-3 flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">
        {total} results · Page {page} / {totalPages}
      </span>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
