import type { Metadata } from "next"
import { Suspense } from "react"

import { ListingSkeleton } from "@/components/listing/listing-skeleton"
import { ProductListing } from "@/components/listing/product-listing"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"

export const metadata: Metadata = {
  title: "All Products",
  description:
    "Saree, Salwar Kameez, Kurti, Dress, Jewelry — all of women's fashion in one place.",
}

export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <div className="shop-container py-6">
      <Breadcrumbs items={[{ label: "All Products" }]} />
      <h1 className="mb-6 font-display text-2xl font-bold md:text-3xl">All Products</h1>
      <Suspense fallback={<ListingSkeleton />}>
        <ProductListing pathname="/products" searchParams={searchParams} showCategories />
      </Suspense>
    </div>
  )
}
