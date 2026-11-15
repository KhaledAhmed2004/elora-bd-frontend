import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"

import { refreshShop, type ShopTag } from "@/app/actions/revalidate"
import { api } from "@/lib/api"
import { PUBLIC_API_URL } from "@/lib/api-config"
import { type AdminUser, useAdminAuthStore } from "@/store/admin-auth-store"

interface SessionResponse {
  accessToken: string
  expiresIn: number
  admin: AdminUser
}

/** Admin API client: adds the Bearer token, refreshes it once on a 401 */
export const adminApi = axios.create({
  baseURL: `${PUBLIC_API_URL}/admin`,
  timeout: 20_000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

adminApi.interceptors.request.use((config) => {
  const token = useAdminAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing: Promise<boolean> | null = null

/**
 * Exchanges the refresh cookie for a new access token. Concurrent callers
 * share one request (two parallel refreshes would look like token theft).
 */
export function refreshSession(): Promise<boolean> {
  refreshing ??= api
    .post<SessionResponse>("/admin/auth/refresh")
    .then(({ data }) => {
      useAdminAuthStore.getState().setSession(data)
      return true
    })
    .catch(() => {
      useAdminAuthStore.getState().clear()
      return false
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

adminApi.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as
      (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
    if (error.response?.status !== 401 || !original || original._retried) {
      return Promise.reject(error)
    }
    original._retried = true
    if (await refreshSession()) return adminApi(original)
    return Promise.reject(error)
  }
)

export const adminAuth = {
  async login(email: string, password: string) {
    const { data } = await api.post<SessionResponse>("/admin/auth/login", {
      email,
      password,
    })
    useAdminAuthStore.getState().setSession(data)
    return data.admin
  },
  async logout() {
    try {
      await api.post("/admin/auth/logout")
    } finally {
      useAdminAuthStore.getState().clear()
    }
  },
  async changePassword(currentPassword: string, newPassword: string) {
    const { data } = await adminApi.post<{ accessToken: string; expiresIn: number }>(
      "/auth/change-password",
      { currentPassword, newPassword }
    )
    const admin = useAdminAuthStore.getState().admin!
    useAdminAuthStore.getState().setSession({ ...data, admin })
  },
}

/**
 * After changing anything the shop shows (products, banners, reviews,
 * settings): tell Next.js to drop its cached copy so customers see it now.
 */
export async function refreshShopCache(tags: ShopTag[] = ["catalog"]) {
  const token = useAdminAuthStore.getState().accessToken
  if (!token) return
  try {
    await refreshShop(token, tags)
  } catch {
    // The shop refreshes on its own within a few minutes anyway
  }
}
