import type { Metadata } from "next"

import { CustomerDetailView } from "@/components/admin/customer-detail-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Customer" }

/** Customers come from browser-stored orders for now, so the phone is read on the client. */
export default function AdminCustomerPage() {
  return <CustomerDetailView />
}
