import type { Metadata } from "next"

import { NewProductView } from "@/components/admin/products-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "New Product" }

export default function NewProductPage() {
  return <NewProductView />
}
