import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { buildListingUrl, type RawSearchParams } from "@/lib/product-query"
import { cn } from "@/lib/utils"

/** 1 … 4 5 [6] 7 8 … 12 */
function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "…")[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push("…")
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push("…")
  pages.push(total)
  return pages
}

interface ListingPaginationProps {
  pathname: string
  searchParams: RawSearchParams
  page: number
  totalPages: number
}

export function ListingPagination({
  pathname,
  searchParams,
  page,
  totalPages,
}: ListingPaginationProps) {
  if (totalPages <= 1) return null
  const href = (p: number) =>
    buildListingUrl(pathname, searchParams, { page: p === 1 ? null : String(p) })

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1">
      <Button asChild variant="ghost" size="icon-lg" aria-disabled={page <= 1}>
        <Link
          href={href(Math.max(1, page - 1))}
          aria-label="Ager page"
          className={cn(page <= 1 && "pointer-events-none opacity-40")}
        >
          <ChevronLeft />
        </Link>
      </Button>
      {pageList(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={p}
            asChild
            variant={p === page ? "default" : "ghost"}
            size="icon-lg"
          >
            <Link href={href(p)} aria-current={p === page ? "page" : undefined}>
              {p}
            </Link>
          </Button>
        )
      )}
      <Button asChild variant="ghost" size="icon-lg" aria-disabled={page >= totalPages}>
        <Link
          href={href(Math.min(totalPages, page + 1))}
          aria-label="Porer page"
          className={cn(page >= totalPages && "pointer-events-none opacity-40")}
        >
          <ChevronRight />
        </Link>
      </Button>
    </nav>
  )
}
