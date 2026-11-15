"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { useHydrated } from "@/hooks/use-hydrated"
import { useAuthStore } from "@/store/auth-store"

/**
 * Client-side guard for account pages (mock auth lives in localStorage).
 * With the real backend, protect these routes on the server instead.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const pathname = usePathname()
  const allowed = Boolean(user?.name)
  // If the user was signed in on this page and then logs out, the logout
  // action decides where to go — don't race it with a redirect to /login.
  const wasAllowed = useRef(false)

  useEffect(() => {
    if (allowed) {
      wasAllowed.current = true
      return
    }
    if (hydrated && !wasAllowed.current) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [hydrated, allowed, pathname, router])

  if (!hydrated || !allowed) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }
  return children
}
