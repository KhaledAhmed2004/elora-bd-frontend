import Image from "next/image"
import Link from "next/link"

import type { Category } from "@/types"

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <ul className="-mx-4 scrollbar-none flex gap-4 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-9 lg:overflow-visible lg:px-0">
      {categories.map((cat) => (
        <li key={cat.id} className="w-20 shrink-0 sm:w-24 lg:w-auto">
          <Link
            href={`/category/${cat.slug}`}
            className="group flex flex-col items-center gap-2"
          >
            <span className="relative aspect-square w-full overflow-hidden rounded-full bg-muted ring-1 ring-gold/40 ring-offset-3 ring-offset-background transition group-hover:ring-2 group-hover:ring-gold">
              {cat.image && (
                <Image
                  src={cat.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 120px, 96px"
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
              )}
            </span>
            <span className="text-center text-xs leading-tight font-medium group-hover:text-gold-ink sm:text-sm">
              {cat.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
