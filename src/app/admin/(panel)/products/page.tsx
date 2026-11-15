import type { Metadata } from "next"

import { ProductsView } from "@/components/admin/products-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Products" }

export default function AdminProductsPage() {
  return <ProductsView />
}
