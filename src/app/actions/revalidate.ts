"use server"

import { updateTag } from "next/cache"

import { SERVER_API_URL } from "@/lib/api-config"

const TAGS = ["catalog", "settings"] as const
export type ShopTag = (typeof TAGS)[number]

/**
 * Called by the admin panel after it changes products, categories, banners,
 * reviews or settings, so the shop shows the change right away.
 * The caller must send a valid admin access token — anyone else is ignored.
 */
export async function refreshShop(accessToken: string, tags: ShopTag[]) {
  const res = await fetch(`${SERVER_API_URL}/admin/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  if (!res.ok) return { ok: false }
  for (const tag of tags) if (TAGS.includes(tag)) updateTag(tag)
  return { ok: true }
}
