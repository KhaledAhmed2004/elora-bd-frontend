import type { Metadata } from "next"

import { EditOrderView } from "@/components/admin/order-pages"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Edit Order" }

export default function EditOrderPage() {
  return <EditOrderView />
}
