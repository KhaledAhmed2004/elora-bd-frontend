"use client"

import { Heart } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useHydrated } from "@/hooks/use-hydrated"
import { cn } from "@/lib/utils"
import { useWishlistStore } from "@/store/wishlist-store"

export function WishlistButton({
  productId,
  className,
}: {
  productId: string
  className?: string
}) {
  const hydrated = useHydrated()
  const active = useWishlistStore((s) => s.productIds.includes(productId)) && hydrated
  const toggle = useWishlistStore((s) => s.toggle)

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={active ? "Remove from Wishlist" : "Add to Wishlist"}
      aria-pressed={active}
      className={cn("rounded-full", className)}
      onClick={() => {
        toggle(productId)
        toast.success(
          active ? "Removed from wishlist" : "Added to wishlist"
        )
      }}
    >
      <Heart className={cn("size-4", active && "fill-blush-deep text-blush-deep")} />
    </Button>
  )
}
