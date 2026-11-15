import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import type { CartItem } from "@/types"

type AddItemInput = Omit<CartItem, "key" | "quantity"> & { quantity?: number }

interface CartState {
  items: CartItem[]
  isOpen: boolean
  couponCode: string | null
  addItem: (item: AddItemInput) => void
  removeItem: (key: string) => void
  updateQuantity: (key: string, quantity: number) => void
  clearCart: () => void
  setCoupon: (code: string | null) => void
  /** Server prices/stock win over what was stored when the item was added */
  syncFromQuote: (
    lines: {
      productId: string
      variantId: string | null
      price: number
      available: number
    }[]
  ) => void
  openCart: () => void
  closeCart: () => void
}

export const cartKey = (productId: string, variantId?: string | null) =>
  variantId ? `${productId}:${variantId}` : productId

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      couponCode: null,

      addItem: ({ quantity = 1, ...item }) =>
        set((state) => {
          const key = cartKey(item.productId, item.variantId)
          const existing = state.items.find((i) => i.key === key)
          if (existing) {
            return {
              isOpen: true,
              items: state.items.map((i) =>
                i.key === key
                  ? { ...i, quantity: Math.min(i.quantity + quantity, i.maxStock) }
                  : i
              ),
            }
          }
          return {
            isOpen: true,
            items: [
              ...state.items,
              { ...item, key, quantity: Math.min(quantity, item.maxStock) },
            ],
          }
        }),

      removeItem: (key) =>
        set((state) => ({ items: state.items.filter((i) => i.key !== key) })),

      updateQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.key !== key)
              : state.items.map((i) =>
                  i.key === key ? { ...i, quantity: Math.min(quantity, i.maxStock) } : i
                ),
        })),

      clearCart: () => set({ items: [], couponCode: null }),
      setCoupon: (couponCode) => set({ couponCode }),
      syncFromQuote: (lines) =>
        set((state) => {
          let changed = false
          const items = state.items.map((i) => {
            const l = lines.find(
              (x) =>
                x.productId === i.productId &&
                (x.variantId ?? null) === (i.variantId ?? null)
            )
            if (!l || (l.price === i.price && l.available === i.maxStock)) return i
            changed = true
            return { ...i, price: l.price, maxStock: Math.max(l.available, 0) }
          })
          return changed ? { items } : state
        }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: "bd-shop-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, couponCode: state.couponCode }),
    }
  )
)

/* Selectors */
export const selectCartCount = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.quantity, 0)

export const selectCartSubtotal = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
