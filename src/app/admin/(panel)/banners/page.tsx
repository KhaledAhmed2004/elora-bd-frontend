import type { Metadata } from "next"

import { BannersView } from "@/components/admin/content-views"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Banners" }

export default function Page() {
  return <BannersView />
}
