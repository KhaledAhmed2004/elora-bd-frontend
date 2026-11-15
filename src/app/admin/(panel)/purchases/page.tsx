import type { Metadata } from "next"

import { PurchasesView } from "@/components/admin/purchases-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Purchases & Suppliers" }

export default function AdminPurchasesPage() {
  return <PurchasesView />
}
