"use client"

import { SlidersHorizontal } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { ProductFacets } from "@/lib/data"

import { ProductFilters } from "./product-filters"

export function MobileFilters(props: {
  facets: ProductFacets
  showCategories?: boolean
  categories?: { slug: string; name: string; count?: number }[]
}) {
  const [open, setOpen] = useState(false)
  const searchParams = useSearchParams()
  const count = ["size", "min", "max", "stock", "sale", "category"].filter((k) =>
    searchParams.has(k)
  ).length

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="lg" className="lg:hidden">
          <SlidersHorizontal /> Filter
          {count > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85%] max-w-sm overflow-y-auto">
        <SheetHeader className="pb-0">
          <SheetTitle className="sr-only">Filter</SheetTitle>
          <SheetDescription className="sr-only">Filter products</SheetDescription>
        </SheetHeader>
        <div className="flex-1 px-4 pb-4">
          <ProductFilters {...props} />
        </div>
        <div className="sticky bottom-0 border-t bg-popover p-4">
          <Button size="lg" className="w-full" onClick={() => setOpen(false)}>
            Show Results
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
