"use client"

import { createContext, useContext } from "react"

import { FALLBACK_SETTINGS, type PublicSettings } from "@/lib/settings-fallback"

const SiteSettingsContext = createContext<PublicSettings | null>(null)

/** Shop settings from the API, fetched once on the server in the shop layout */
export function SiteSettingsProvider({
  settings,
  children,
}: {
  settings: PublicSettings
  children: React.ReactNode
}) {
  return <SiteSettingsContext value={settings}>{children}</SiteSettingsContext>
}

/** Falls back to the built-in defaults outside the shop layout (e.g. dev validation renders) */
export function useSiteSettings(): PublicSettings {
  return useContext(SiteSettingsContext) ?? FALLBACK_SETTINGS
}
