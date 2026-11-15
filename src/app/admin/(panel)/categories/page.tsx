import type { Metadata } from "next"

import { CategoriesView } from "@/components/admin/content-views"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Categories" }

export default function Page() {
  return <CategoriesView />
}
