import { create } from "zustand"
import { persist } from "zustand/middleware"

interface WishlistState {
  productIds: string[]
  toggle: (productId: string) => void
  has: (productId: string) => boolean
  clear: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (id) =>
        set((s) => ({
          productIds: s.productIds.includes(id)
            ? s.productIds.filter((p) => p !== id)
            : [...s.productIds, id],
        })),
      has: (id) => get().productIds.includes(id),
      clear: () => set({ productIds: [] }),
    }),
    { name: "bd-shop-wishlist" }
  )
)
