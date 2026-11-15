import type { Metadata } from "next"

import { PopupsView } from "@/components/admin/popups-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Campaign Popups" }

export default function Page() {
  return <PopupsView />
}
