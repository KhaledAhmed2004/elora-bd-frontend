import { SearchX } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export function NotFoundContent() {
  return (
    <div className="shop-container flex flex-col items-center gap-5 py-20 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-accent">
        <SearchX className="size-10 text-primary" />
      </span>
      <div>
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">
          Page not found
        </h1>
        <p className="mt-2 text-muted-foreground">
          The link may be broken, or the product is no longer available.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild size="lg">
          <Link href="/">Go Home</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/products">All Products</Link>
        </Button>
      </div>
    </div>
  )
}
