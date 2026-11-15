import type { Metadata } from "next"

import { ExpensesView } from "@/components/admin/expenses-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Expenses" }

export default function Page() {
  return <ExpensesView />
}
