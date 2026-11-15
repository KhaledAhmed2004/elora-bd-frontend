"use client"

import { ShoppingCart } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { analytics } from "@/lib/analytics"
import { useCartStore } from "@/store/cart-store"
import type { Product } from "@/types"

/**
 * Products without variants go straight into the cart.
 * Products with sizes/colors send the customer to the details page to pick one.
 */
/** One look for every card CTA, so the grid reads evenly */
const ctaClass =
  "mt-1 h-auto min-h-8 w-full border-gold/40 bg-transparent px-2 py-1.5 text-center text-xs leading-tight font-semibold whitespace-normal text-foreground hover:border-espresso hover:bg-espresso hover:text-gold-light sm:text-[0.8rem] dark:hover:border-gold dark:hover:bg-gold dark:hover:text-espresso"

export function QuickAddButton({
  product,
  disabled,
}: {
  product: Product
  disabled?: boolean
}) {
  const addItem = useCartStore((s) => s.addItem)

  if (disabled) {
    return (
      <Button
        variant="secondary"
        size="sm"
        disabled
        className="mt-1 h-auto min-h-8 w-full px-2 py-1.5 text-xs leading-tight whitespace-normal sm:text-[0.8rem]"
      >
        Out of Stock
      </Button>
    )
  }

  if (product.variants?.length) {
    return (
      <Button asChild variant="outline" size="sm" className={ctaClass}>
        <Link href={`/products/${product.slug}`}>Select Size</Link>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={ctaClass}
      onClick={() => {
        addItem({
          productId: product.id,
          name: product.name,
          slug: product.slug,
          image: product.images[0]?.url ?? "/placeholder.svg",
          price: product.price,
          maxStock: product.stock,
        })
        analytics.addToCart({ id: product.id, name: product.name, price: product.price })
      }}
    >
      <ShoppingCart /> Add to Cart
    </Button>
  )
}
