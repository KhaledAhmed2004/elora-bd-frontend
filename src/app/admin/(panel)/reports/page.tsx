import type { Metadata } from "next"

import { ReportsView } from "@/components/admin/reports-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Reports" }

export default function Page() {
  return <ReportsView />
}
