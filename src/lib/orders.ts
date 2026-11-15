/**
 * Customer-side order helpers. Orders are created and read through the API
 * (src/lib/shop-api.ts).
 */
import { isApiStatus } from "@/lib/api"
import { shopApi } from "@/lib/shop-api"
import type { Order, OrderStatus } from "@/types"

/** `null` when no order matches the number + phone */
export async function trackOrder(
  orderNumber: string,
  phone: string
): Promise<Order | null> {
  try {
    return await shopApi.track(orderNumber.trim(), phone)
  } catch (e) {
    if (isApiStatus(e, 404)) return null
    throw e
  }
}

/** What the delivery person collects (COD minus any advance) */
export function codDue(
  order: Pick<Order, "paymentMethod" | "paymentStatus" | "total" | "advance">
) {
  if (order.paymentMethod !== "cod" || order.paymentStatus === "paid") return 0
  return Math.max(0, order.total - (order.advance?.amount ?? 0))
}

export const ORDER_STEPS: { status: OrderStatus; label: string; text: string }[] = [
  { status: "pending", label: "Order Received", text: "We've received your order" },
  { status: "confirmed", label: "Confirmed", text: "Confirmed by phone" },
  { status: "processing", label: "Packing", text: "Your items are being packed" },
  {
    status: "shipped",
    label: "Shipped",
    text: "Handed over to the courier",
  },
  { status: "delivered", label: "Delivered", text: "Your order has been delivered" },
]
