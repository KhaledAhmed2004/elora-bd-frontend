"use client"

import { Minus, Plus, ShoppingCart, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { WhatsappIcon } from "@/components/shared/social-icons"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"
import { useSiteSettings } from "@/providers/site-settings"
import { analytics } from "@/lib/analytics"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { colorHex, uniqueValues, variantLabel } from "@/lib/variants"
import { useCartStore } from "@/store/cart-store"
import type { Product, ProductVariant } from "@/types"

import { Price } from "./price"
import { WishlistButton } from "./wishlist-button"

export function ProductPurchase({ product }: { product: Product }) {
  const router = useRouter()
  const { whatsapp } = useSiteSettings()
  const addItem = useCartStore((s) => s.addItem)
  const closeCart = useCartStore((s) => s.closeCart)

  const variants = product.variants ?? []
  const hasVariants = variants.length > 0
  const colors = uniqueValues(variants, "color")
  const sizes = uniqueValues(variants, "size")
  const hasColors = colors.length > 0
  const hasSizes = sizes.length > 0
  const [color, setColor] = useState<string | null>(null)
  const [size, setSize] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [selectError, setSelectError] = useState(false)

  const matches = (v: ProductVariant, c: string | null, sz: string | null) =>
    (!hasColors || v.attributes.color === c) && (!hasSizes || v.attributes.size === sz)
  const variant =
    (!hasColors || color) && (!hasSizes || size)
      ? variants.find((v) => matches(v, color, size))
      : undefined

  function pick(nextColor: string | null, nextSize: string | null) {
    // A new colour can make the chosen size unavailable (and vice versa) — drop the other
    if (
      nextColor &&
      nextSize &&
      !variants.some((v) => matches(v, nextColor, nextSize) && v.stock > 0)
    ) {
      if (nextColor !== color) nextSize = null
      else nextColor = null
    }
    setColor(nextColor)
    setSize(nextSize)
    setSelectError(false)
    const next =
      (!hasColors || nextColor) && (!hasSizes || nextSize)
        ? variants.find((v) => matches(v, nextColor, nextSize))
        : undefined
    if (next) setQty((q) => Math.max(1, Math.min(q, next.stock)))
  }
  const price = variant?.price ?? product.price
  const comparePrice = variant?.comparePrice ?? product.comparePrice
  const stock = variant ? variant.stock : hasVariants ? 0 : product.stock
  const outOfStock = product.stock <= 0

  useEffect(() => {
    analytics.viewContent({ id: product.id, name: product.name, price: product.price })
  }, [product.id, product.name, product.price])

  function add(): boolean {
    if (hasVariants && !variant) {
      setSelectError(true)
      toast.error(
        hasColors && !color ? "Please select a color first" : "Please select a size first"
      )
      return false
    }
    addItem({
      productId: product.id,
      variantId: variant?.id ?? null,
      name: product.name,
      slug: product.slug,
      image: product.images[0]?.url ?? "/placeholder.svg",
      price,
      quantity: qty,
      maxStock: variant ? variant.stock : product.stock,
      attributes: variant?.attributes,
    })
    analytics.addToCart({ id: product.id, name: product.name, price, quantity: qty })
    return true
  }

  const waText = encodeURIComponent(
    `Hi, I'd like to order this product:\n${product.name}` +
      (variant ? `\n${variantLabel(variant.attributes, { sep: "\n" })}` : "") +
      `\nQuantity: ${qty}\nPrice: ${formatPrice(price * qty)}\n${siteConfig.url}/products/${product.slug}`
  )

  return (
    <div className="space-y-6">
      <Price price={price} comparePrice={comparePrice} size="lg" showBadge />

      <p
        className={cn(
          "text-sm font-medium",
          outOfStock
            ? "text-destructive"
            : product.stock <= 5
              ? "text-gold-ink"
              : "text-primary"
        )}
      >
        {outOfStock
          ? "Out of Stock — coming soon"
          : product.stock <= 5
            ? `Only ${product.stock} left!`
            : "✓ In Stock"}
      </p>

      {hasColors && (
        <OptionGroup
          legend="Color"
          selected={color}
          error={selectError && !color}
          options={colors.map((c) => ({
            value: c,
            disabled: !variants.some(
              (v) =>
                v.attributes.color === c &&
                v.stock > 0 &&
                (!size || v.attributes.size === size)
            ),
          }))}
          onSelect={(c) => pick(c, size)}
          swatch
        />
      )}

      {hasSizes && (
        <OptionGroup
          legend="Size"
          selected={size}
          error={selectError && !size}
          options={sizes.map((sz) => ({
            value: sz,
            disabled: !variants.some(
              (v) =>
                v.attributes.size === sz &&
                v.stock > 0 &&
                (!color || v.attributes.color === color)
            ),
          }))}
          onSelect={(sz) => pick(color, sz)}
        />
      )}

      {!outOfStock && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold">Quantity</span>
          <div className="flex items-center rounded-lg border">
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Decrease quantity"
              disabled={qty <= 1}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Minus />
            </Button>
            <span
              className="w-10 text-center font-medium tabular-nums"
              aria-live="polite"
            >
              {qty}
            </span>
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Increase quantity"
              disabled={hasVariants ? !variant || qty >= stock : qty >= stock}
              onClick={() => setQty((q) => q + 1)}
            >
              <Plus />
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="lg"
          variant="outline"
          className="h-12 min-w-34 flex-1 border-primary text-primary hover:bg-accent hover:text-primary"
          disabled={outOfStock}
          onClick={add}
        >
          <ShoppingCart /> Add to Cart
        </Button>
        <Button
          size="lg"
          className="h-12 min-w-34 flex-1"
          disabled={outOfStock}
          onClick={() => {
            if (!add()) return
            closeCart()
            router.push("/checkout")
          }}
        >
          <Zap /> Buy Now
        </Button>
        <WishlistButton
          productId={product.id}
          className="size-12 shrink-0 rounded-lg border border-border"
        />
      </div>

      <Button
        asChild
        size="lg"
        variant="outline"
        className="h-12 w-full border-gold/40 bg-blush-soft hover:bg-secondary"
      >
        <a
          href={`https://wa.me/${whatsapp}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {/* WhatsApp's own green kept on the icon only, for recognition */}
          <WhatsappIcon className="size-5 text-[#1fae54]" /> Order on WhatsApp
        </a>
      </Button>
    </div>
  )
}

function OptionGroup({
  legend,
  selected,
  options,
  onSelect,
  error,
  swatch,
}: {
  legend: string
  selected: string | null
  options: { value: string; disabled: boolean }[]
  onSelect: (value: string) => void
  error: boolean
  swatch?: boolean
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">
        {legend}:{" "}
        {selected ?? (
          <span className="font-normal text-muted-foreground">Select one</span>
        )}
      </legend>
      <div
        className={cn(
          "flex flex-wrap gap-2 rounded-lg",
          error && "animate-pulse ring-2 ring-destructive ring-offset-4"
        )}
      >
        {options.map(({ value, disabled }) => {
          const active = value === selected
          const hex = swatch ? colorHex(value) : undefined
          return (
            <button
              key={value}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onSelect(value)}
              className={cn(
                "relative inline-flex min-w-12 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:border-primary",
                disabled &&
                  "cursor-not-allowed text-muted-foreground line-through opacity-50 hover:border-border"
              )}
            >
              {swatch && (
                <span
                  aria-hidden
                  className="size-4 shrink-0 rounded-full border border-black/15"
                  style={{
                    background:
                      hex ?? "repeating-linear-gradient(45deg,#ddd 0 3px,#fff 3px 6px)",
                  }}
                />
              )}
              {value}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
