import type { Metadata, Viewport } from "next"
import {
  Cinzel,
  Cormorant_Garamond,
  Geist,
  Geist_Mono,
  Hind_Siliguri,
} from "next/font/google"

import { Analytics } from "@/components/analytics/analytics"
import { siteConfig } from "@/config/site"
import { Providers } from "@/providers/providers"

import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })
const hindSiliguri = Hind_Siliguri({
  variable: "--font-bangla",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
})
/** Brand display serif — page and section headings (font-display) */
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
})
/** Logo wordmark only (font-logo) — matches the client's ELORA lettering */
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["600", "700"],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    url: siteConfig.url,
  },
}

export const viewport: Viewport = {
  // Storefront is light-only (ThemeProvider: defaultTheme light, no system)
  themeColor: "#fffbfa",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="bn"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${hindSiliguri.variable} ${cormorant.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}
