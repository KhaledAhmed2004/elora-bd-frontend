import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { ListingSkeleton } from "@/components/listing/listing-skeleton"
import { ProductListing } from "@/components/listing/product-listing"
import { Breadcrumbs, type Crumb } from "@/components/shared/breadcrumbs"
import { Skeleton } from "@/components/ui/skeleton"
import { getAllCategorySlugs, getCategoryBySlug } from "@/lib/data"

export async function generateStaticParams() {
  return (await getAllCategorySlugs()).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const match = await getCategoryBySlug(slug)
  if (!match) return {}
  const name = match.parent
    ? `${match.category.name} ${match.parent.name}`
    : match.category.name
  return {
    title: name,
    description: `New ${name} collection — Cash on Delivery nationwide.`,
    openGraph: match.category.image ? { images: [match.category.image] } : undefined,
  }
}

export default function CategoryPage({
  params,
  searchParams,
}: PageProps<"/category/[slug]">) {
  return (
    <div className="shop-container py-6">
      <Suspense fallback={<CategoryPageSkeleton />}>
        <CategoryContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

function CategoryPageSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-5 w-40" />
      <Skeleton className="mb-6 h-9 w-56" />
      <ListingSkeleton />
    </div>
  )
}

async function CategoryContent({
  params,
  searchParams,
}: Pick<PageProps<"/category/[slug]">, "params" | "searchParams">) {
  const { slug } = await params
  const match = await getCategoryBySlug(slug)
  if (!match) notFound()

  const { category, parent } = match
  const top = parent ?? category
  const crumbs: Crumb[] = parent
    ? [{ label: parent.name, href: `/category/${parent.slug}` }, { label: category.name }]
    : [{ label: category.name }]

  const subCategories = top.children?.length
    ? [
        { slug: top.slug, name: "All" },
        ...top.children.map((c) => ({ slug: c.slug, name: c.name })),
      ]
    : undefined

  return (
    <>
      <Breadcrumbs items={crumbs} />
      <h1 className="font-display text-2xl font-bold md:text-3xl">
        {parent ? `${category.name} ${parent.name}` : category.name}
      </h1>

      <div className="mt-6">
        <Suspense fallback={<ListingSkeleton />}>
          <ProductListing
            pathname={`/category/${slug}`}
            searchParams={searchParams}
            baseQuery={{ category: slug }}
            showCategories={true}
            categories={subCategories}
          />
        </Suspense>
      </div>
    </>
  )
}
