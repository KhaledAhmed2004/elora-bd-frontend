"use client"

import { ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX } from "lucide-react"

import { type CustomerRisk, RISK_STYLE } from "@/lib/admin/risk"
import { cn } from "@/lib/utils"

const ICON = {
  blacklisted: ShieldX,
  risky: ShieldAlert,
  new: ShieldQuestion,
  good: ShieldCheck,
}

export function RiskBadge({
  risk,
  className,
}: {
  risk: CustomerRisk
  className?: string
}) {
  const s = RISK_STYLE[risk.level]
  const Icon = ICON[risk.level]
  return (
    <span
      title={
        risk.successRate === null
          ? "No delivery records"
          : `Delivery success ${risk.successRate}%`
      }
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        s.className,
        className
      )}
    >
      <Icon className="size-3.5" />
      {s.label}
      {risk.successRate !== null &&
        risk.level !== "blacklisted" &&
        ` ${risk.successRate}%`}
    </span>
  )
}
