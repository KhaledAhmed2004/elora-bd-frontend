"use client"

import { usePathname } from "next/navigation"
import Script from "next/script"
import { useEffect, useRef } from "react"

export function FacebookPixel({ pixelId }: { pixelId: string }) {
  const pathname = usePathname()
  const isFirst = useRef(true)

  // Track PageView on client-side navigation (first one is fired by the init script)
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    window.fbq?.("track", "PageView")
  }, [pathname])

  return (
    <Script id="fb-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');fbq('track','PageView');`}
    </Script>
  )
}
