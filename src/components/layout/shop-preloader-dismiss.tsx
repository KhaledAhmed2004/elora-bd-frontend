"use client"

import { useEffect } from "react"

/**
 * Hides the preloader once the shutter has rolled up.
 * Hides (not removes) the node, because React owns it.
 */
export function ShopPreloaderDismiss() {
  useEffect(() => {
    const el = document.getElementById("shop-preloader")
    if (!el) return
    const hide = () => el.setAttribute("data-done", "")

    const onEnd = (e: AnimationEvent) => {
      if (e.animationName === "sp-shutter-up" || e.animationName === "sp-fade-out") hide()
    }
    el.addEventListener("animationend", onEnd)
    // Fallback in case animationend never fires (tab in background etc.)
    const timer = window.setTimeout(hide, 3200)
    return () => {
      el.removeEventListener("animationend", onEnd)
      window.clearTimeout(timer)
    }
  }, [])

  return null
}
