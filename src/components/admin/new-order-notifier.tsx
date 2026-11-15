"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { toast } from "sonner"

import { adminQueries, useAdminQuery } from "@/lib/admin/queries"
import { formatPrice } from "@/lib/format"

/** Short two-tone "ding" with Web Audio — no sound file needed */
function playDing() {
  try {
    const ctx = new AudioContext()
    ;[880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.4)
    })
    setTimeout(() => void ctx.close(), 1000)
  } catch {
    // Audio blocked until the admin has clicked somewhere — the toast still shows
  }
}

/**
 * Polls the newest website orders every 20 s and announces new ones with a
 * sound (Settings → "New order sound") and a toast.
 */
export function NewOrderNotifier() {
  const router = useRouter()
  const qc = useQueryClient()
  const known = useRef<Set<string> | null>(null)
  const { data: latest } = useAdminQuery(
    ["orders", "newest-website"],
    () => adminQueries.orders({ source: "website", limit: 10 }),
    { refetchInterval: 20_000, refetchIntervalInBackground: true, staleTime: 0 }
  )
  const { data: settings } = useAdminQuery(["settings"], adminQueries.settings)

  useEffect(() => {
    if (!latest) return
    const ids = latest.data.map((o) => o.id)
    // First load: remember what exists, announce nothing
    if (!known.current) {
      known.current = new Set(ids)
      return
    }
    const fresh = latest.data.filter((o) => !known.current!.has(o.id))
    ids.forEach((id) => known.current!.add(id))
    if (!fresh.length) return
    if (settings?.newOrderSound !== false) playDing()
    for (const o of fresh) {
      toast.success(`New order ${o.orderNumber} — ${formatPrice(o.total)}`, {
        description: `${o.shippingAddress.fullName} · ${o.shippingAddress.district}`,
        duration: 15_000,
        action: { label: "Open", onClick: () => router.push(`/admin/orders/${o.id}`) },
      })
    }
    void qc.invalidateQueries({ queryKey: ["admin", "dashboard"] })
    void qc.invalidateQueries({ queryKey: ["admin", "orders"] })
  }, [latest, settings?.newOrderSound, router, qc])

  return null
}
