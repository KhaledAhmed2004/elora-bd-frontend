import type { ProductVariant } from "@/types"

/** Display order for variant attributes */
const ATTR_ORDER = ["color", "size"]

const ATTR_LABEL: Record<string, { en: string; bn: string }> = {
  color: { en: "Color", bn: "রং" },
  size: { en: "Size", bn: "সাইজ" },
}

const sortedEntries = (attrs: Record<string, string>) =>
  Object.entries(attrs)
    .filter(([, v]) => Boolean(v))
    .sort(([a], [b]) => {
      const ia = ATTR_ORDER.indexOf(a)
      const ib = ATTR_ORDER.indexOf(b)
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
    })

/** "Color: Red · Size: M" (empty string when there are no attributes) */
export function variantLabel(
  attrs?: Record<string, string> | null,
  opts: { sep?: string; lang?: "en" | "bn" } = {}
) {
  if (!attrs) return ""
  const { sep = " · ", lang = "en" } = opts
  return sortedEntries(attrs)
    .map(([k, v]) => `${ATTR_LABEL[k]?.[lang] ?? k}: ${v}`)
    .join(sep)
}

/** "Red / M" — compact form for selects and tables */
export const variantShort = (attrs?: Record<string, string> | null) =>
  attrs
    ? sortedEntries(attrs)
        .map(([, v]) => v)
        .join(" / ")
    : ""

export const uniqueValues = (variants: ProductVariant[], key: "color" | "size") => [
  ...new Set(variants.map((v) => v.attributes[key]).filter(Boolean)),
]

/** Common clothing colours → swatch. Unknown names fall back to a neutral swatch. */
const COLOR_HEX: Record<string, string> = {
  black: "#111111",
  white: "#ffffff",
  "off white": "#f5f1e6",
  cream: "#f3e9d2",
  red: "#c62828",
  maroon: "#6d1a24",
  pink: "#ec7fa9",
  "baby pink": "#f6c1d0",
  magenta: "#c2185b",
  purple: "#6a1b9a",
  lavender: "#b9a6d6",
  blue: "#1e5bb8",
  "sky blue": "#7cc4ef",
  navy: "#1a2a4f",
  teal: "#00796b",
  green: "#2e7d32",
  olive: "#6b6b2a",
  mint: "#a8dcc4",
  yellow: "#f2c230",
  mustard: "#c99a1e",
  golden: "#c9a227",
  orange: "#e8772e",
  peach: "#f5b994",
  brown: "#6d4c41",
  beige: "#d9c7a7",
  grey: "#8a8a8a",
  gray: "#8a8a8a",
  silver: "#c0c0c0",
}

export const colorHex = (name: string) => COLOR_HEX[name.trim().toLowerCase()]

/** "sky blue" → "Sky Blue" */
export const titleCase = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
