import { RotateCcw, Truck, Wallet } from "lucide-react"

import { formatPrice } from "@/lib/format"
import { getStoreSettings } from "@/lib/site-settings"

export async function DeliveryInfo() {
  const { insideDhaka, outsideDhaka, freeDeliveryMinimum } = (await getStoreSettings())
    .delivery
  const rows = [
    {
      icon: Truck,
      title: "Delivery Charge",
      text: `Inside Dhaka ${formatPrice(insideDhaka)} (1-2 days) · Outside Dhaka ${formatPrice(outsideDhaka)} (3-5 days)`,
      note: `Free on orders over ${formatPrice(freeDeliveryMinimum)}`,
    },
    {
      icon: Wallet,
      title: "Cash on Delivery",
      text: "Check your product on arrival, then pay. bKash, Nagad and card payments also accepted.",
    },
    {
      icon: RotateCcw,
      title: "7-Day Easy Exchange",
      text: "Exchange within 7 days if the size doesn't fit or there's a problem with the product.",
    },
  ]

  return (
    <ul className="divide-y rounded-xl border">
      {rows.map(({ icon: Icon, title, text, note }) => (
        <li key={title} className="flex gap-3 p-4">
          <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-semibold">{title}</p>
            <p className="text-muted-foreground">{text}</p>
            {note && <p className="mt-1 text-xs font-medium text-primary">{note}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}
