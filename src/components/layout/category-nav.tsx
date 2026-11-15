import { ChevronDown, LayoutGrid } from "lucide-react"
import Link from "next/link"

import type { Category } from "@/types"

/** Desktop category bar with hover dropdowns (CSS only, no JS). */
export function CategoryNav({ categories }: { categories: Category[] }) {
  return (
    <nav aria-label="Categories" className="hidden border-t bg-blush-soft/60 lg:block">
      <ul className="shop-container flex min-h-11 flex-wrap items-center gap-x-0.5 gap-y-1 py-1 text-[13px] xl:gap-1 xl:text-sm">
        <li>
          <Link
            href="/products"
            className="mr-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 font-semibold whitespace-nowrap text-primary hover:bg-blush/40 xl:mr-2 xl:gap-2 xl:px-3"
          >
            <LayoutGrid className="size-4 shrink-0" /> All Products
          </Link>
        </li>
        {categories.map((cat) => (
          <li key={cat.id} className="group relative">
            <Link
              href={`/category/${cat.slug}`}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 font-medium whitespace-nowrap text-foreground/80 hover:bg-blush/40 hover:text-foreground xl:px-3"
            >
              {cat.name}
              {cat.children?.length ? (
                <ChevronDown className="size-3.5 transition-transform group-focus-within:rotate-180 group-hover:rotate-180" />
              ) : null}
            </Link>
            {cat.children?.length ? (
              <div className="invisible absolute top-full left-0 z-40 pt-1 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <ul className="min-w-52 rounded-xl border bg-popover p-1.5 shadow-lg">
                  {cat.children.map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={`/category/${sub.slug}`}
                        className="block rounded-md px-3 py-2 hover:bg-blush-soft hover:text-gold-ink"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  )
}
