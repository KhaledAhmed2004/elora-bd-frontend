import { PackageSearch } from "lucide-react"
import Link from "next/link"

import { ProductCard } from "@/components/product/product-card"
import { Button } from "@/components/ui/button"
import { getProductFacets, getProducts, type ProductQuery } from "@/lib/data"
import { parseProductQuery, type RawSearchParams } from "@/lib/product-query"

import { ListingPagination } from "./listing-pagination"
import { MobileFilters } from "./mobile-filters"
import { ProductFilters } from "./product-filters"
import { SortSelect } from "./sort-select"

interface ProductListingProps {
  pathname: string
  searchParams: Promise<RawSearchParams>
  /** Fixed filters for this page (e.g. the category on a category page) */
  baseQuery?: ProductQuery
  showCategories?: boolean
  categories?: { slug: string; name: string; count?: number }[]
}

/** Reads searchParams, so it must be rendered inside <Suspense>. */
export async function ProductListing({
  pathname,
  searchParams,
  baseQuery,
  showCategories = false,
  categories,
}: ProductListingProps) {
  const sp = await searchParams
  const query = { ...parseProductQuery(sp), ...baseQuery }
  const [{ data, meta }, facets] = await Promise.all([
    getProducts(query),
    getProductFacets({ category: query.category, search: query.search }),
  ])

  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1
  const to = Math.min(meta.page * meta.limit, meta.total)

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-32">
          <ProductFilters
            facets={facets}
            showCategories={showCategories}
            categories={categories}
          />
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {meta.total > 0 ? (
              <>
                <span className="font-medium text-foreground">
                  {from}–{to}
                </span>{" "}
                of {meta.total} products
              </>
            ) : (
              "No products"
            )}
          </p>
          <div className="flex items-center gap-2">
            <MobileFilters
              facets={facets}
              showCategories={showCategories}
              categories={categories}
            />
            <SortSelect />
          </div>
        </div>

        {data.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
              {data.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 4} />
              ))}
            </div>
            <ListingPagination
              pathname={pathname}
              searchParams={sp}
              page={meta.page}
              totalPages={meta.totalPages}
            />
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-16 text-center">
            <PackageSearch className="size-12 text-muted-foreground" />
            <div>
              <p className="font-semibold">No products match these filters</p>
              <p className="text-sm text-muted-foreground">
                Try changing the filters or browse all products
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={pathname}>Clear Filters</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
