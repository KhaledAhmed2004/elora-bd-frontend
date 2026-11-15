import { Skeleton } from "@/components/ui/skeleton"

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Skeleton className="aspect-3/4 rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )
}

export function ListingSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid gap-8 lg:grid-cols-[240px_1fr]"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="hidden space-y-4 lg:block">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-38 sm:w-44" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
          {Array.from({ length: count }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
