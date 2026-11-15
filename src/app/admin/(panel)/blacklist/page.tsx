import type { Metadata } from "next"

import { BlacklistView } from "@/components/admin/blacklist-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Blacklist" }

export default function Page() {
  return <BlacklistView />
}
