import type { Metadata } from "next"

import { NewOrderView } from "@/components/admin/order-pages"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "New Order" }

export default function NewOrderPage() {
  return <NewOrderView />
}
