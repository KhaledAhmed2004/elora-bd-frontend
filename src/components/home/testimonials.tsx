import { Quote, Star } from "lucide-react"

import type { Testimonial } from "@/data/testimonials"
import { cn } from "@/lib/utils"

export function Testimonials({ items }: { items: Testimonial[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {items.map((t) => (
        <li
          key={t.id}
          className="relative flex flex-col rounded-2xl border border-blush bg-blush-soft p-5 dark:border-border"
        >
          <Quote className="absolute top-4 right-4 size-8 text-gold/40" />
          <div className="flex gap-0.5" aria-label={`${t.rating} out of 5`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={cn(
                  "size-4",
                  i < t.rating ? "fill-gold text-gold" : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <p className="mt-3 flex-1 text-sm leading-relaxed">&ldquo;{t.text}&rdquo;</p>
          <div className="mt-4 flex items-center gap-3 border-t pt-4">
            <span className="flex size-10 items-center justify-center rounded-full font-semibold text-espresso bg-gold-cta">
              {t.name.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{t.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {t.location} · {t.product}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
