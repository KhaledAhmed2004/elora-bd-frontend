import type { Metadata } from "next"

import { CustomersView } from "@/components/admin/customers-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Customers" }

export default function AdminCustomersPage() {
  return <CustomersView />
}
