import type { Metadata } from "next"

import { StaffView } from "@/components/admin/staff-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Staff" }

export default function AdminStaffPage() {
  return <StaffView />
}
