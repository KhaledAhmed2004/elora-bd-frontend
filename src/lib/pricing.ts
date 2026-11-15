"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useEffect } from "react"

import { type QuoteProblem, shopApi } from "@/lib/shop-api"
import { useCartStore } from "@/store/cart-store"
import type { CartItem, PaymentMethod } from "@/types"

export interface AppliedCoupon {
  code: string
  description: string
}

export interface Totals {
  subtotal: number
  discount: number
  deliveryCharge: number
  /** false until the customer picks a district */
  deliveryKnown: boolean
  total: number
  coupon: AppliedCoupon | null
  /** Delivery charge the shop wants paid in advance (0 = not needed) */
  advanceAmount: number
  /** Out of stock / removed items — checkout is blocked while any exist */
  problems: QuoteProblem[]
  /** Error of a coupon that no longer applies (expired, limit reached) */
  couponError: string | null
  /** true until the server has priced the current cart */
  pending: boolean
}

/** Pure helper for previews (admin order form) — the server decides the real charge */
export function deliveryChargeFor(
  delivery: { insideDhaka: number; outsideDhaka: number; freeDeliveryMinimum: number },
  district: string | undefined,
  subtotal: number
) {
  if (delivery.freeDeliveryMinimum > 0 && subtotal >= delivery.freeDeliveryMinimum)
    return 0
  return district === "Dhaka" ? delivery.insideDhaka : delivery.outsideDhaka
}

const lineKey = (items: CartItem[]) =>
  items.map((i) => `${i.productId}:${i.variantId ?? ""}x${i.quantity}`).join("|")

/**
 * Cart totals priced by the API (live prices, stock, coupon, delivery charge).
 * Also refreshes each cart line's price and stock limit from the server.
 */
export function useCartQuote(
  opts: { district?: string; paymentMethod?: PaymentMethod } = {}
): Totals {
  const items = useCartStore((s) => s.items)
  const couponCode = useCartStore((s) => s.couponCode)
  const syncFromQuote = useCartStore((s) => s.syncFromQuote)

  const { data, isFetching } = useQuery({
    queryKey: [
      "quote",
      lineKey(items),
      couponCode,
      opts.district ?? "",
      opts.paymentMethod ?? "",
    ],
    queryFn: () =>
      shopApi.quote({
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId ?? null,
          quantity: i.quantity,
        })),
        couponCode,
        district: opts.district || null,
        paymentMethod: opts.paymentMethod,
      }),
    enabled: items.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (data) syncFromQuote(data.items)
  }, [data, syncFromQuote])

  // Until the first quote arrives, show the cart's own numbers
  const localSubtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  if (!data) {
    return {
      subtotal: localSubtotal,
      discount: 0,
      deliveryCharge: 0,
      deliveryKnown: false,
      total: localSubtotal,
      coupon: null,
      advanceAmount: 0,
      problems: [],
      couponError: null,
      pending: items.length > 0,
    }
  }

  return {
    subtotal: data.subtotal,
    discount: data.discount,
    deliveryCharge: data.deliveryCharge,
    deliveryKnown: data.deliveryKnown,
    total: data.total,
    coupon: data.coupon?.ok
      ? { code: data.coupon.code, description: data.coupon.description }
      : null,
    advanceAmount: data.advanceAmount,
    problems: data.problems,
    couponError: data.coupon && !data.coupon.ok ? data.coupon.error : null,
    pending: isFetching,
  }
}
