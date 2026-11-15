"use client"

import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google"
import { usePathname } from "next/navigation"

import { FacebookPixel } from "./facebook-pixel"

interface TrackingIds {
  gtmId: string
  ga4Id: string
  fbPixelId: string
}

export function TrackingScripts({ ids }: { ids: TrackingIds }) {
  const pathname = usePathname()
  // Never track the admin panel (skews ads data + leaks order pages to Meta)
  if (pathname.startsWith("/admin")) return null

  return (
    <>
      {ids.gtmId && <GoogleTagManager gtmId={ids.gtmId} />}
      {ids.ga4Id && !ids.gtmId && <GoogleAnalytics gaId={ids.ga4Id} />}
      {ids.fbPixelId && <FacebookPixel pixelId={ids.fbPixelId} />}
    </>
  )
}
