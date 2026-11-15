import type { CustomerRisk, RiskLevel } from "./queries"

export type { CustomerRisk, RiskLevel }

/** Risk is computed by the API from the shop's order history and the blacklist */
export const RISK_STYLE: Record<RiskLevel, { label: string; className: string }> = {
  blacklisted: { label: "Blacklist", className: "bg-zinc-900 text-white" },
  risky: { label: "Risky", className: "bg-red-100 text-red-800" },
  new: { label: "New", className: "bg-sky-100 text-sky-800" },
  good: { label: "Good", className: "bg-emerald-100 text-emerald-800" },
}
