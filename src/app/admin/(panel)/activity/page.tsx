import type { Metadata } from "next"

import { ActivityView } from "@/components/admin/activity-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Activity Log" }

export default function AdminActivityPage() {
  return <ActivityView />
}
