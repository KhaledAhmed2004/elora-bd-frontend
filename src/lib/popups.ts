/**
 * Campaign popups: shared types + the rules that decide whether a popup may
 * show on this page, on this device, right now. Used by the storefront popup
 * and by the admin preview / status badges.
 */

export type PopupLayout = "IMAGE" | "SPLIT" | "TEXT"
export type PopupTrigger = "ON_LOAD" | "DELAY" | "SCROLL" | "EXIT_INTENT"
export type PopupFrequency = "ONCE" | "DAILY" | "SESSION" | "ALWAYS"
export type PopupPages = "ALL" | "HOME" | "SHOPPING"
export type PopupDevice = "ALL" | "MOBILE" | "DESKTOP"

/** What the storefront receives (GET /popups) */
export interface ShopPopup {
  id: string
  badge: string | null
  title: string
  subtitle: string | null
  image: string | null
  cta: string | null
  href: string | null
  couponCode: string | null
  layout: PopupLayout
  trigger: PopupTrigger
  delaySeconds: number
  scrollPercent: number
  frequency: PopupFrequency
  pages: PopupPages
  device: PopupDevice
  startsAt: string | null
  endsAt: string | null
  showCountdown: boolean
  priority: number
}

export const LAYOUT_LABEL: Record<PopupLayout, string> = {
  IMAGE: "Full image",
  SPLIT: "Image + text",
  TEXT: "Text only",
}

export const TRIGGER_LABEL: Record<PopupTrigger, string> = {
  ON_LOAD: "As soon as the page opens",
  DELAY: "After a few seconds",
  SCROLL: "After scrolling down",
  EXIT_INTENT: "When the visitor is about to leave",
}

export const FREQUENCY_LABEL: Record<PopupFrequency, string> = {
  ONCE: "Only once per visitor",
  DAILY: "Once a day",
  SESSION: "Once per visit",
  ALWAYS: "Every page load (testing)",
}

export const PAGES_LABEL: Record<PopupPages, string> = {
  ALL: "All shop pages",
  HOME: "Home page only",
  SHOPPING: "Product & category pages",
}

export const DEVICE_LABEL: Record<PopupDevice, string> = {
  ALL: "Mobile & desktop",
  MOBILE: "Mobile only",
  DESKTOP: "Desktop only",
}

/**
 * Pages where a popup would get in the way of buying or signing in.
 * Never shown here, whatever the campaign says.
 */
const BLOCKED_PREFIXES = [
  "/cart",
  "/checkout",
  "/order-success",
  "/login",
  "/account",
  "/track-order",
]
const SHOPPING_PREFIXES = ["/products", "/category", "/search"]

const startsWithAny = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`))

export function pageAllowed(pages: PopupPages, pathname: string) {
  if (startsWithAny(pathname, BLOCKED_PREFIXES)) return false
  if (pages === "HOME") return pathname === "/"
  if (pages === "SHOPPING") return startsWithAny(pathname, SHOPPING_PREFIXES)
  return true
}

export function deviceAllowed(device: PopupDevice, isMobile: boolean) {
  return device === "ALL" || (device === "MOBILE") === isMobile
}

export type ScheduleState = "scheduled" | "running" | "ended"

export function scheduleState(
  p: Pick<ShopPopup, "startsAt" | "endsAt">,
  now = Date.now()
): ScheduleState {
  if (p.endsAt && new Date(p.endsAt).getTime() <= now) return "ended"
  if (p.startsAt && new Date(p.startsAt).getTime() > now) return "scheduled"
  return "running"
}

// ───────── Frequency capping (browser storage) ─────────

const KEY = (id: string) => `elora:popup:${id}`
const SESSION_SHOWN = "elora:popup:session"
const DAY = 24 * 60 * 60 * 1000

interface Seen {
  /** Last time it was shown (ms) */
  at: number
  /** Visitor pressed the button: never show this campaign again */
  converted?: boolean
}

function read(storage: Storage, key: string): Seen | null {
  try {
    const raw = storage.getItem(key)
    return raw ? (JSON.parse(raw) as Seen) : null
  } catch {
    return null
  }
}

function write(storage: Storage, key: string, value: Seen) {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode / storage full: the popup may show again, that's all
  }
}

/** False when this visitor already saw it often enough */
export function frequencyAllows(p: Pick<ShopPopup, "id" | "frequency">) {
  if (p.frequency === "ALWAYS") return true
  // One campaign popup per visit at most: two in a row feels like spam
  if (read(sessionStorage, SESSION_SHOWN)) return false
  const seen = read(localStorage, KEY(p.id))
  if (!seen) return true
  if (seen.converted || p.frequency === "ONCE") return false
  if (p.frequency === "DAILY") return Date.now() - seen.at > DAY
  // SESSION: a new visit (sessionStorage was empty above) may show it again
  return true
}

export function markShown(id: string) {
  const prev = read(localStorage, KEY(id))
  write(localStorage, KEY(id), { ...prev, at: Date.now() })
  write(sessionStorage, SESSION_SHOWN, { at: Date.now() })
}

export function markConverted(id: string) {
  write(localStorage, KEY(id), { at: Date.now(), converted: true })
}
