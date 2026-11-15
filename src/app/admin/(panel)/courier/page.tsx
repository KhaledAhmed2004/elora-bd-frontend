import type { Metadata } from "next"

import { CourierView } from "@/components/admin/courier-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Courier & COD" }

export default function Page() {
  return <CourierView />
}
