import type { Metadata } from "next"

import { EditProductView } from "@/components/admin/products-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Edit Product" }

export default function EditProductPage() {
  return <EditProductView />
}
