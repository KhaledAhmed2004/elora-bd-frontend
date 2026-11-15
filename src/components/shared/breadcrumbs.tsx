import Link from "next/link"
import { Fragment } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export interface Crumb {
  label: string
  href?: string
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...items]
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {all.map((c, i) => (
          <Fragment key={`${c.label}-${i}`}>
            <BreadcrumbItem>
              {c.href && i < all.length - 1 ? (
                <BreadcrumbLink asChild>
                  <Link href={c.href}>{c.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="line-clamp-1">{c.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {i < all.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
