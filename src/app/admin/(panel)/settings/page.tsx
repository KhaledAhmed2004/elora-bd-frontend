import type { Metadata } from "next"

import { SettingsView } from "@/components/admin/settings-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Settings" }

export default function Page() {
  return <SettingsView />
}
