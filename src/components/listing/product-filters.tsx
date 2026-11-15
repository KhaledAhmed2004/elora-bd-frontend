"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFieldId } from "@/hooks/use-field-id"
import type { ProductFacets } from "@/lib/data"
import { formatPrice } from "@/lib/format"
import { buildListingUrl } from "@/lib/product-query"
import { cn } from "@/lib/utils"

const PRICE_PRESETS = [
  { label: "Under ৳1,000", min: null, max: "1000" },
  { label: "৳1,000 – ৳3,000", min: "1000", max: "3000" },
  { label: "৳3,000 – ৳6,000", min: "3000", max: "6000" },
  { label: "Over ৳6,000", min: "6000", max: null },
]

interface ProductFiltersProps {
  facets: ProductFacets
  /** Show the category list (on /products and /search, not on category pages) */
  showCategories?: boolean
}

export function ProductFilters({ facets, showCategories }: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const fid = useFieldId()

  const selectedSizes = searchParams.get("size")?.split(",").filter(Boolean) ?? []
  const currentCategory = searchParams.get("category")
  const currentMin = searchParams.get("min") ?? ""
  const currentMax = searchParams.get("max") ?? ""

  // Local inputs, reset whenever the URL values change
  const [priceKey, setPriceKey] = useState(`${currentMin}-${currentMax}`)
  const [min, setMin] = useState(currentMin)
  const [max, setMax] = useState(currentMax)
  if (priceKey !== `${currentMin}-${currentMax}`) {
    setPriceKey(`${currentMin}-${currentMax}`)
    setMin(currentMin)
    setMax(currentMax)
  }

  function update(changes: Record<string, string | null>) {
    const url = buildListingUrl(pathname, searchParams, { ...changes, page: null })
    startTransition(() => router.push(url, { scroll: false }))
  }

  function toggleSize(size: string) {
    const next = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size]
    update({ size: next.length ? next.join(",") : null })
  }

  const hasFilters = ["size", "min", "max", "stock", "sale", "category"].some((k) =>
    searchParams.has(k)
  )

  return (
    <div className={cn("space-y-6 transition-opacity", pending && "opacity-60")}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filter</h2>
        {hasFilters && (
          <button
            type="button"
            onClick={() =>
              update({
                size: null,
                min: null,
                max: null,
                stock: null,
                sale: null,
                category: null,
              })
            }
            className="text-xs font-medium text-primary hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      {showCategories && facets.categories.length > 0 && (
        <FilterGroup title="Category">
          <ul className="space-y-1">
            {facets.categories.map((c) => {
              const active = currentCategory === c.slug
              return (
                <li key={c.slug}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => update({ category: active ? null : c.slug })}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted",
                      active && "bg-accent font-medium text-primary"
                    )}
                  >
                    {c.name}
                    <span className="text-xs text-muted-foreground">{c.count}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </FilterGroup>
      )}

      <FilterGroup title="Price">
        <ul className="space-y-1">
          {PRICE_PRESETS.map((p) => {
            const active = currentMin === (p.min ?? "") && currentMax === (p.max ?? "")
            return (
              <li key={p.label}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    update(active ? { min: null, max: null } : { min: p.min, max: p.max })
                  }
                  className={cn(
                    "w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                    active && "bg-accent font-medium text-primary"
                  )}
                >
                  {p.label}
                </button>
              </li>
            )
          })}
        </ul>
        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            update({ min: min || null, max: max || null })
          }}
        >
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            aria-label="Minimum price"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="h-9"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            aria-label="Maximum price"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="h-9"
          />
          <Button type="submit" size="sm" className="h-9">
            OK
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          {formatPrice(facets.priceRange.min)} – {formatPrice(facets.priceRange.max)}
        </p>
      </FilterGroup>

      {facets.sizes.length > 0 && (
        <FilterGroup title="Size">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((size) => {
              const active = selectedSizes.includes(size)
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleSize(size)}
                  className={cn(
                    "min-w-10 rounded-md border px-2.5 py-1.5 text-sm transition-colors hover:border-primary",
                    active && "border-primary bg-primary text-primary-foreground"
                  )}
                >
                  {size}
                </button>
              )
            })}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Availability">
        <div className="space-y-3">
          <CheckRow
            id={fid("f-stock")}
            label="In Stock Only"
            checked={searchParams.get("stock") === "1"}
            onChange={(v) => update({ stock: v ? "1" : null })}
          />
          <CheckRow
            id={fid("f-sale")}
            label="On Sale"
            checked={searchParams.get("sale") === "1"}
            onChange={(v) => update({ sale: v ? "1" : null })}
          />
        </div>
      </FilterGroup>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t pt-5">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function CheckRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <Label htmlFor={id} className="text-sm font-normal">
        {label}
      </Label>
    </div>
  )
}
