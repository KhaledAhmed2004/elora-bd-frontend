const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"]

/** 1250 -> "৳1,250" (en) or "৳১,২৫০" (bn) */
export function formatPrice(amount: number, locale: "en" | "bn" = "en"): string {
  const formatted = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    amount
  )
  return `৳${locale === "bn" ? toBanglaDigits(formatted) : formatted}`
}

export function toBanglaDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)])
}

/** Discount percentage, e.g. (1500, 1250) -> 17 */
export function discountPercent(comparePrice: number | null | undefined, price: number) {
  if (!comparePrice || comparePrice <= price) return 0
  return Math.round(((comparePrice - price) / comparePrice) * 100)
}

/** "+880 1712-345678" / "8801712345678" -> "01712345678" */
export const normalizeBdPhone = (phone: string) =>
  phone.replace(/[\s-]/g, "").replace(/^\+?880/, "0")

/** "01712345678" -> "+880 1712-345678" */
export function formatPhone(phone: string): string {
  const p = phone.replace(/\D/g, "").replace(/^880/, "0")
  if (p.length !== 11) return phone
  return `+880 ${p.slice(1, 5)}-${p.slice(5)}`
}

export function formatDate(date: string | Date, locale: "en" | "bn" = "en") {
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
