import { CartDrawer } from "@/components/cart/cart-drawer"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { NotFoundContent } from "@/components/shared/not-found-content"
import { getStoreSettings } from "@/lib/site-settings"
import { SiteSettingsProvider } from "@/providers/site-settings"

/** Unmatched URLs render outside the (shop) layout, so add the shop chrome here. */
export default async function NotFound() {
  const settings = await getStoreSettings()
  return (
    <SiteSettingsProvider settings={settings}>
      <Header />
      <main className="flex-1">
        <NotFoundContent />
      </main>
      <Footer />
      <CartDrawer />
    </SiteSettingsProvider>
  )
}
