import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { Order } from "@/types"

/**
 * Orders placed from this browser (as the API returned them). Used by the
 * order-success page and "My Orders" until customer login uses the API.
 */
interface RecentOrdersState {
  orders: Order[]
  add: (order: Order) => void
}

export const useRecentOrdersStore = create<RecentOrdersState>()(
  persist(
    (set) => ({
      orders: [],
      add: (order) =>
        set((s) => ({
          orders: [order, ...s.orders.filter((o) => o.id !== order.id)].slice(0, 30),
        })),
    }),
    { name: "bd-shop-recent-orders" }
  )
)
