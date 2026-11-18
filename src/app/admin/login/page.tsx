import type { Metadata } from "next"
import Image from "next/image"
import { Suspense } from "react"

import { AdminLogin } from "@/components/admin/admin-login"
import { Logo } from "@/components/shared/logo"
import { siteConfig } from "@/config/site"

export const metadata: Metadata = { title: "Admin Login" }

// Layout based on shadcn/ui block "login-02": form left, cover image right (lg+).
export default function AdminLoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
          <Logo size="sm" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <Suspense fallback={null}>
              <AdminLogin />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <Image
          src="/brand/admin-login-cover.jpg"
          alt={`${siteConfig.name} Showroom`}
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-espresso/80 via-espresso/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="font-display text-3xl font-semibold">{siteConfig.slogan}</p>
          <p className="mt-2 max-w-md text-sm text-white/80">
            Orders, stock, couriers and customers — everything for running{" "}
            {siteConfig.name} in one place.
          </p>
        </div>
      </div>
    </div>
  )
}
