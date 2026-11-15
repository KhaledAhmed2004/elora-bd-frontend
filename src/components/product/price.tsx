import { discountPercent, formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

interface PriceProps {
  price: number
  comparePrice?: number | null
  size?: "sm" | "md" | "lg"
  showBadge?: boolean
  className?: string
}

const sizes = {
  sm: { price: "text-base", compare: "text-xs" },
  md: { price: "text-lg", compare: "text-sm" },
  lg: { price: "text-2xl md:text-3xl", compare: "text-base" },
}

export function Price({
  price,
  comparePrice,
  size = "sm",
  showBadge = false,
  className,
}: PriceProps) {
  const off = discountPercent(comparePrice, price)

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn("font-bold text-foreground tabular-nums", sizes[size].price)}>
        {formatPrice(price)}
      </span>
      {off > 0 && (
        <>
          <span
            className={cn(
              "text-muted-foreground tabular-nums line-through",
              sizes[size].compare
            )}
          >
            {formatPrice(comparePrice!)}
          </span>
          {showBadge && (
            <span className="rounded bg-sale/10 px-1.5 py-0.5 text-xs font-semibold text-sale">
              {off}% OFF
            </span>
          )}
        </>
      )}
    </div>
  )
}
