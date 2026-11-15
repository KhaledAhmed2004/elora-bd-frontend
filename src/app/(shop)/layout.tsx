import { Suspense } from "react"

import { CartDrawer } from "@/components/cart/cart-drawer"
import { FloatingChat } from "@/components/layout/floating-chat"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { ShopPreloader } from "@/components/layout/shop-preloader"
import { CampaignPopupManager } from "@/components/marketing/campaign-popup"
import { getLivePopups } from "@/lib/data"
import { getStoreSettings } from "@/lib/site-settings"
import { SiteSettingsProvider } from "@/providers/site-settings"

export default async function ShopLayout({ children }: LayoutProps<"/">) {
  // Cached ("settings" tag), so it stays part of the static shell
  const settings = await getStoreSettings()
  return (
    <SiteSettingsProvider settings={settings}>
      <ShopPreloader />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <FloatingChat />
      {/* usePathname inside — needs Suspense under Cache Components for dynamic routes */}
      <Suspense fallback={null}>
        <MobileBottomNav />
      </Suspense>
      <Suspense fallback={null}>
        <CampaignPopups />
      </Suspense>
    </SiteSettingsProvider>
  )
}

/** Cached ("catalog"/"popups" tags); the browser decides if and when to show one */
async function CampaignPopups() {
  const popups = await getLivePopups()
  return popups.length ? <CampaignPopupManager popups={popups} /> : null
}
