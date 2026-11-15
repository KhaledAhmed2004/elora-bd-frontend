import { Suspense } from "react"

import { AdminShell } from "@/components/admin/admin-shell"

/**
 * The panel renders only after the browser has restored the admin session
 * (client-side auth), so Next can't pre-validate instant navigation here.
 */
export const instant = false

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    // usePathname inside — Suspense keeps dynamic admin routes prerenderable
    <Suspense fallback={null}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  )
}
