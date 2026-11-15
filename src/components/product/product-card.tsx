import { Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { discountPercent } from "@/lib/format"
import type { Product } from "@/types"

import { Price } from "./price"
import { QuickAddButton } from "./quick-add-button"
import { WishlistButton } from "./wishlist-button"

export function ProductCard({
  product,
  priority,
}: {
  product: Product
  priority?: boolean
}) {
  const off = discountPercent(product.comparePrice, product.price)
  const outOfStock = product.stock <= 0
  const href = `/products/${product.slug}`

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-[box-shadow,border-color] hover:border-gold/40 hover:shadow-lg hover:shadow-gold/10">
      <div className="relative aspect-3/4 overflow-hidden bg-muted">
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="relative block size-full"
        >
          <Image
            src={product.images[0]?.url ?? "/placeholder.svg"}
            alt={product.images[0]?.alt ?? product.name}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 25vw, 50vw"
            loading={priority ? "eager" : undefined}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Second photo fades in on hover (pointer devices only) */}
          {product.images[1] && (
            <Image
              src={product.images[1].url}
              alt=""
              fill
              sizes="(min-width: 1280px) 20vw, (min-width: 768px) 25vw, 50vw"
              className="hidden object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-fine:block"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute top-2 left-2 flex flex-col gap-1">
          {off > 0 && (
            <span className="rounded-md bg-sale px-1.5 py-0.5 text-[11px] font-semibold text-sale-foreground">
              -{off}%
            </span>
          )}
          {product.isNew && (
            <span className="rounded-md bg-espresso px-1.5 py-0.5 text-[11px] font-semibold text-gold-light">
              New
            </span>
          )}
        </div>

        <WishlistButton
          productId={product.id}
          className="absolute top-2 right-2 bg-background/90 shadow-sm backdrop-blur"
        />

        {outOfStock && (
          <div className="absolute inset-x-0 bottom-0 bg-foreground/70 py-1.5 text-center text-xs font-medium text-background">
            Stock Out
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:p-3">
        <p className="text-[11px] font-medium tracking-wider text-gold-ink uppercase">
          {product.category.name}
        </p>
        <h3 className="line-clamp-2 min-h-10 text-sm leading-5 font-medium">
          <Link href={href} className="transition-colors hover:text-gold-ink">
            {product.name}
          </Link>
        </h3>
        {product.rating ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3.5 fill-gold text-gold" />
            <span className="font-medium text-foreground">
              {product.rating.toFixed(1)}
            </span>
            <span>({product.reviewCount})</span>
          </div>
        ) : null}
        <Price
          price={product.price}
          comparePrice={product.comparePrice}
          className="mt-auto"
        />
        <QuickAddButton product={product} disabled={outOfStock} />
      </div>
    </article>
  )
}
