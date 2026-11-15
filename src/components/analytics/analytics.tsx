import { Suspense } from "react"

import { getStoreSettings } from "@/lib/site-settings"

import { TrackingScripts } from "./tracking-scripts"

/**
 * Loads the trackers whose IDs are set — admin Settings (API) first, then .env.
 * (usePathname inside → Suspense keeps the root layout prerenderable.)
 */
export async function Analytics() {
  if (process.env.NODE_ENV !== "production") return null
  const { tracking } = await getStoreSettings()
  return (
    <Suspense fallback={null}>
      <TrackingScripts
        ids={{
          gtmId: tracking.gtmId || process.env.NEXT_PUBLIC_GTM_ID || "",
          ga4Id: tracking.ga4Id || process.env.NEXT_PUBLIC_GA_ID || "",
          fbPixelId: tracking.fbPixelId || process.env.NEXT_PUBLIC_FB_PIXEL_ID || "",
        }}
      />
    </Suspense>
  )
}
