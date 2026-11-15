import type { Metadata } from "next"

import { CouponsView } from "@/components/admin/coupons-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Coupons" }

export default function AdminCouponsPage() {
  return <CouponsView />
}
