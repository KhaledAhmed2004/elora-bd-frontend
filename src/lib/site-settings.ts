import { cacheLife, cacheTag } from "next/cache"

import { serverGet } from "@/lib/api-config"
import {
  FALLBACK_SETTINGS as FALLBACK,
  type PublicSettings,
} from "@/lib/settings-fallback"

export type { PublicSettings }

/** Shop settings for server components (header, footer, product page) */
export async function getStoreSettings(): Promise<PublicSettings> {
  "use cache"
  cacheLife("minutes")
  cacheTag("settings")
  try {
    return (await serverGet<PublicSettings>("/settings")) ?? FALLBACK
  } catch {
    return FALLBACK
  }
}
