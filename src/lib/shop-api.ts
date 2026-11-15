/**
 * Storefront calls made from the browser (cart, checkout, tracking, reviews).
 * Server-rendered catalog reads live in src/lib/data.ts.
 */
import { api } from "@/lib/api"
import type { SearchSuggestion } from "@/lib/data"
import type { Order, PaymentMethod, ShippingAddress } from "@/types"

export interface CartLineInput {
  productId: string
  variantId?: string | null
  quantity: number
}

export interface QuoteProblem {
  productId: string
  variantId: string | null
  name?: string
  reason: "not-found" | "unavailable" | "variant-required" | "out-of-stock"
  available?: number
  message: string
}

export type CouponResult =
  | {
      ok: true
      code: string
      description: string
      type: "PERCENT" | "FIXED" | "FREE_SHIPPING"
      discount: number
      freeShipping: boolean
    }
  | { ok: false; error: string }

export interface Quote {
  items: {
    productId: string
    variantId: string | null
    name: string
    price: number
    quantity: number
    available: number
  }[]
  problems: QuoteProblem[]
  subtotal: number
  discount: number
  deliveryCharge: number
  deliveryKnown: boolean
  total: number
  coupon: CouponResult | null
  /** Delivery charge to pay in advance (0 = not needed) */
  advanceAmount: number
}

export interface PlaceOrderInput {
  items: CartLineInput[]
  couponCode?: string | null
  shippingAddress: ShippingAddress
  email?: string
  paymentMethod: PaymentMethod
  note?: string
  advance?: { method: "bkash" | "nagad"; trxId: string; senderNumber?: string } | null
}

export const shopApi = {
  suggest: (q: string) =>
    api
      .get<SearchSuggestion[]>("/products/suggest", { params: { q } })
      .then((r) => r.data),

  quote: (body: {
    items: CartLineInput[]
    couponCode?: string | null
    district?: string | null
    paymentMethod?: PaymentMethod
  }) => api.post<Quote>("/checkout/quote", body).then((r) => r.data),

  checkCoupon: (code: string, subtotal: number) =>
    api.post<CouponResult>("/coupons/check", { code, subtotal }).then((r) => r.data),

  placeOrder: (body: PlaceOrderInput) =>
    api.post<Order>("/orders", body).then((r) => r.data),

  track: (orderNumber: string, phone: string) =>
    api.post<Order>("/orders/track", { orderNumber, phone }).then((r) => r.data),

  lead: (body: {
    phone: string
    fullName?: string
    division?: string
    district?: string
    upazila?: string
    address?: string
    items: CartLineInput[]
  }) => api.post("/checkout/lead", body).then((r) => r.data),

  submitReview: (
    slug: string,
    body: { name: string; phone?: string; rating: number; text: string }
  ) =>
    api
      .post<{ ok: true; message: string }>(
        `/products/${encodeURIComponent(slug)}/reviews`,
        body
      )
      .then((r) => r.data),

  /** Popup view/click counter. Never blocks or throws: stats are best effort. */
  popupEvent: (id: string, type: "view" | "click") => {
    void api.post(`/popups/${encodeURIComponent(id)}/events`, { type }).catch(() => {})
  },
}
