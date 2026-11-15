"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { buildListingUrl, SORT_OPTIONS } from "@/lib/product-query"

export function SortSelect() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const value = searchParams.get("sort") ?? "newest"

  return (
    <Select
      value={value}
      onValueChange={(v) =>
        startTransition(() =>
          router.push(
            buildListingUrl(pathname, searchParams, {
              sort: v === "newest" ? null : v,
              page: null,
            }),
            { scroll: false }
          )
        )
      }
    >
      <SelectTrigger className="h-9 w-38 sm:w-44" aria-label="Sort">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {SORT_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
