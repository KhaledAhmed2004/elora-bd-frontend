import { siteConfig } from "@/config/site"

/** What GET /api/settings returns (no internal courier costs) */
export interface PublicSettings {
  storeName: string
  phone: string
  email: string
  whatsapp: string
  address: string
  announcement: string
  delivery: { insideDhaka: number; outsideDhaka: number; freeDeliveryMinimum: number }
  payments: { cod: boolean; bkash: boolean; nagad: boolean; sslcommerz: boolean }
  advance: {
    mode: "none" | "delivery-charge" | "outside-dhaka"
    bkashNumber: string
    nagadNumber: string
  }
  invoiceLang: "en" | "bn"
  tracking: { fbPixelId: string; gtmId: string; ga4Id: string; capiTestCode: string }
}

/** Used only if the API can't be reached, so the shop still renders */
export const FALLBACK_SETTINGS: PublicSettings = {
  storeName: siteConfig.name,
  phone: siteConfig.contact.phone,
  email: siteConfig.contact.email,
  whatsapp: siteConfig.contact.whatsapp,
  address: siteConfig.contact.address,
  announcement: "",
  delivery: { ...siteConfig.delivery },
  payments: { cod: true, bkash: false, nagad: false, sslcommerz: false },
  advance: { mode: "none", bkashNumber: "", nagadNumber: "" },
  invoiceLang: "en",
  tracking: { fbPixelId: "", gtmId: "", ga4Id: "", capiTestCode: "" },
}
