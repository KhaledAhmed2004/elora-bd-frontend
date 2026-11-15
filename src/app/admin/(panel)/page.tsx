import { DashboardView } from "@/components/admin/dashboard-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export default function AdminDashboardPage() {
  return <DashboardView />
}
