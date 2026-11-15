import type { Metadata } from "next"
import { Suspense } from "react"

import { AccountNav } from "@/components/account/account-nav"

export const metadata: Metadata = {
  title: { default: "My Account", template: "%s | My Account" },
  robots: { index: false },
}

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="shop-container grid gap-6 py-6 lg:grid-cols-[240px_1fr] lg:gap-10 lg:py-10">
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <Suspense fallback={null}>
          <AccountNav />
        </Suspense>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
