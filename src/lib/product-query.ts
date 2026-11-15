import type { ProductQuery, ProductSort } from "@/lib/data"

/**
 * URL format for listing pages:
 *   ?sort=price-asc&page=2&min=500&max=3000&size=M,L&stock=1&sale=1&category=saree&q=jamdani
 */
export type RawSearchParams = Record<string, string | string[] | undefined>

export const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "popular", label: "Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "discount", label: "Biggest Discount" },
]

export const PAGE_SIZE = 12

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

const toNumber = (v: string | undefined) => {
  if (!v) return undefined
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

export function parseProductQuery(sp: RawSearchParams): ProductQuery {
  const sort = first(sp.sort) as ProductSort | undefined
  const page = Math.max(1, Math.floor(toNumber(first(sp.page)) ?? 1))
  const sizes = first(sp.size)?.split(",").filter(Boolean)

  return {
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? sort : "newest",
    page,
    limit: PAGE_SIZE,
    minPrice: toNumber(first(sp.min)),
    maxPrice: toNumber(first(sp.max)),
    sizes: sizes?.length ? sizes : undefined,
    inStock: first(sp.stock) === "1" || undefined,
    onSale: first(sp.sale) === "1" || undefined,
    category: first(sp.category) || undefined,
    search: first(sp.q)?.trim() || undefined,
  }
}

/** Builds a URL for the same listing with some params changed */
export function buildListingUrl(
  pathname: string,
  current: RawSearchParams | URLSearchParams,
  changes: Record<string, string | null>
) {
  const params = new URLSearchParams()
  if (current instanceof URLSearchParams) {
    current.forEach((v, k) => params.set(k, v))
  } else {
    for (const [k, v] of Object.entries(current)) {
      const val = first(v)
      if (val) params.set(k, val)
    }
  }
  for (const [k, v] of Object.entries(changes)) {
    if (v == null || v === "") params.delete(k)
    else params.set(k, v)
  }
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}
