import type { CallResult, OrderSource } from "@/types"

export const COURIERS = ["Steadfast", "Pathao", "RedX"] as const
export type CourierName = (typeof COURIERS)[number]

export const SOURCE_LABEL: Record<OrderSource, string> = {
  website: "Website",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  phone: "Phone call",
  instagram: "Instagram",
}

export const CALL_RESULT_LABEL: Record<CallResult, string> = {
  confirmed: "Confirmed",
  "no-answer": "No answer",
  busy: "Busy / switched off",
  callback: "Asked to call back later",
  cancelled: "Cancelled",
}
