import { create } from "zustand"

export type AdminRole = "OWNER" | "MANAGER" | "STAFF"

export interface AdminUser {
  kind: "admin"
  id: string
  name: string
  email: string
  role: AdminRole
}

/**
 * Admin session, kept in memory only (never localStorage, so a script injected
 * into the page can't read a saved token). On page load the session is
 * restored from the httpOnly refresh cookie — see src/lib/admin/admin-api.ts.
 */
interface AdminAuthState {
  /** "checking" until the first refresh attempt has finished */
  status: "checking" | "signed-in" | "signed-out"
  admin: AdminUser | null
  accessToken: string | null
  /** epoch ms */
  expiresAt: number
  setSession: (s: { admin: AdminUser; accessToken: string; expiresIn: number }) => void
  clear: () => void
}

export const useAdminAuthStore = create<AdminAuthState>()((set) => ({
  status: "checking",
  admin: null,
  accessToken: null,
  expiresAt: 0,
  setSession: ({ admin, accessToken, expiresIn }) =>
    set({
      status: "signed-in",
      admin,
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
    }),
  clear: () =>
    set({ status: "signed-out", admin: null, accessToken: null, expiresAt: 0 }),
}))

/** Role checks for showing/hiding UI (the API enforces them anyway) */
export const can = {
  manage: (role?: AdminRole) => role === "OWNER" || role === "MANAGER",
  own: (role?: AdminRole) => role === "OWNER",
}
