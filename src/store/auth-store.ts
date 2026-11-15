import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { ShippingAddress, User } from "@/types"

export interface SavedAddress extends ShippingAddress {
  id: string
  label: string
  isDefault: boolean
}

/**
 * TEMPORARY client-side auth. With the backend this becomes a JWT session
 * (httpOnly refresh cookie + access token) — keep the same shape for the UI.
 */
interface AuthState {
  user: User | null
  addresses: SavedAddress[]
  /** Remembers names per phone so re-login restores the profile (mock only) */
  knownProfiles: Record<
    string,
    Pick<User, "name" | "email"> & { addresses?: SavedAddress[] }
  >
  login: (user: User) => void
  logout: () => void
  updateProfile: (data: Pick<User, "name" | "email">) => void
  saveAddress: (address: Omit<SavedAddress, "id"> & { id?: string }) => void
  removeAddress: (id: string) => void
  setDefaultAddress: (id: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      addresses: [],
      knownProfiles: {},

      login: (user) =>
        set((s) => {
          const known = s.knownProfiles[user.phone]
          return {
            user,
            addresses: known?.addresses ?? [],
            knownProfiles: user.name
              ? {
                  ...s.knownProfiles,
                  [user.phone]: { ...known, name: user.name, email: user.email },
                }
              : s.knownProfiles,
          }
        }),

      // Addresses are cleared from view (shared devices) but kept per phone for re-login
      logout: () =>
        set((s) =>
          s.user
            ? {
                user: null,
                addresses: [],
                knownProfiles: {
                  ...s.knownProfiles,
                  [s.user.phone]: {
                    ...s.knownProfiles[s.user.phone],
                    name: s.user.name,
                    email: s.user.email,
                    addresses: s.addresses,
                  },
                },
              }
            : s
        ),

      updateProfile: (data) =>
        set((s) =>
          s.user
            ? {
                user: { ...s.user, ...data },
                knownProfiles: {
                  ...s.knownProfiles,
                  [s.user.phone]: { ...s.knownProfiles[s.user.phone], ...data },
                },
              }
            : s
        ),

      saveAddress: ({ id, ...address }) =>
        set((s) => {
          const makeDefault = address.isDefault || s.addresses.length === 0
          let list = s.addresses
          if (id) {
            list = list.map((a) => (a.id === id ? { ...address, id } : a))
          } else {
            list = [...list, { ...address, id: crypto.randomUUID() }]
          }
          const targetId = id ?? list[list.length - 1].id
          return {
            addresses: makeDefault
              ? list.map((a) => ({ ...a, isDefault: a.id === targetId }))
              : list,
          }
        }),

      removeAddress: (id) =>
        set((s) => {
          const list = s.addresses.filter((a) => a.id !== id)
          if (list.length && !list.some((a) => a.isDefault))
            list[0] = { ...list[0], isDefault: true }
          return { addresses: list }
        }),

      setDefaultAddress: (id) =>
        set((s) => ({
          addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
        })),
    }),
    { name: "bd-shop-auth" }
  )
)
