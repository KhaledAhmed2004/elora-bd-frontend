import type { Metadata } from "next"
import Image from "next/image"
import { Suspense } from "react"

import { LoginView } from "@/components/auth/login-view"
import { HangerHeart } from "@/components/shared/brand-divider"
import { Skeleton } from "@/components/ui/skeleton"
import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: "Login",
  robots: { index: false },
}

export default function LoginPage() {
  return (
    <div className="shop-container py-6 md:py-12">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border bg-card shadow-sm lg:grid-cols-2">
        {/* Brand panel: store photo with the slogan */}
        <div className="relative aspect-video lg:aspect-auto lg:min-h-[560px]">
          <Image
            src="/brand/elora-store-login.jpg"
            alt="Elora Fashion & Lifestyle store er bhetor"
            fill
            preload
            sizes="(min-width: 1024px) 512px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-espresso/85 via-espresso/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
            <HangerHeart className="h-5 w-9 text-gold-light" />
            <p className="mt-2 font-display text-2xl leading-tight font-bold sm:text-3xl">
              {siteConfig.slogan}
            </p>
            <p className="mt-1 font-display text-sm text-gold-light italic sm:text-base">
              Elora Fashion &amp; Lifestyle
            </p>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex items-center bg-blush-soft/40 p-6 sm:p-10">
          <Suspense
            fallback={<Skeleton className="mx-auto h-80 w-full max-w-md rounded-2xl" />}
          >
            <LoginView className="border-0 p-0 md:p-0" />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
