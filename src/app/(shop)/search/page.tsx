import type { Metadata } from "next"
import { Suspense } from "react"

import { ListingSkeleton } from "@/components/listing/listing-skeleton"
import { ProductListing } from "@/components/listing/product-listing"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false },
}

async function SearchTitle({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const { q } = await searchParams
  const query = (Array.isArray(q) ? q[0] : q)?.trim()
  return (
    <h1 className="mb-6 font-display text-2xl font-bold md:text-3xl">
      {query ? <>&ldquo;{query}&rdquo; er result</> : "Search"}
    </h1>
  )
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className="shop-container py-6">
      <Breadcrumbs items={[{ label: "Search" }]} />
      <Suspense fallback={<Skeleton className="mb-6 h-9 w-64" />}>
        <SearchTitle searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<ListingSkeleton />}>
        <ProductListing pathname="/search" searchParams={searchParams} showCategories />
      </Suspense>
    </div>
  )
}
