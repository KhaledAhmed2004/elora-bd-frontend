import type { Metadata } from "next"

import { IncompleteOrdersView } from "@/components/admin/incomplete-orders-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Incomplete Orders" }

export default function AdminIncompleteOrdersPage() {
  return <IncompleteOrdersView />
}
