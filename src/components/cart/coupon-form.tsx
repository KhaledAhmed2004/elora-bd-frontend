"use client"

import { TicketPercent, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/api"
import type { AppliedCoupon } from "@/lib/pricing"
import { shopApi } from "@/lib/shop-api"
import { useCartStore } from "@/store/cart-store"

export function CouponForm({
  subtotal,
  applied,
  staleError,
}: {
  subtotal: number
  applied: AppliedCoupon | null
  /** A previously applied coupon that stopped working (expired, limit reached) */
  staleError?: string | null
}) {
  const setCoupon = useCartStore((s) => s.setCoupon)
  const couponCode = useCartStore((s) => s.couponCode)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  if (couponCode && staleError && !applied) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-destructive/50 px-3 py-2 text-xs text-destructive">
        <span>
          <strong>{couponCode}</strong>: {staleError}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Remove coupon"
          onClick={() => setCoupon(null)}
        >
          <X />
        </Button>
      </div>
    )
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-dashed border-primary bg-accent/50 px-3 py-2 text-sm">
        <span className="flex items-center gap-2">
          <TicketPercent className="size-4 text-primary" />
          <span>
            <strong>{applied.code}</strong>{" "}
            <span className="text-muted-foreground">— {applied.description}</span>
          </span>
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Remove coupon"
          onClick={() => setCoupon(null)}
        >
          <X />
        </Button>
      </div>
    )
  }

  return (
    <form
      className="space-y-1.5"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!code.trim() || checking) return
        setChecking(true)
        try {
          const result = await shopApi.checkCoupon(code.trim(), subtotal)
          if (result.ok) {
            setCoupon(result.code)
            setCode("")
            setError(null)
            toast.success(`Coupon "${result.code}" applied`)
          } else {
            setError(result.error)
          }
        } catch (err) {
          setError(getErrorMessage(err))
        } finally {
          setChecking(false)
        }
      }}
    >
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError(null)
          }}
          placeholder="Coupon code"
          aria-label="Coupon code"
          aria-invalid={Boolean(error)}
          className="h-9 uppercase placeholder:normal-case"
        />
        <Button type="submit" variant="secondary" className="h-9" disabled={checking}>
          Apply
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  )
}
