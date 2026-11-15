import { Star } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { ProductCarousel } from "@/components/home/product-carousel"
import { SectionHeader } from "@/components/home/section-header"
import { DeliveryInfo } from "@/components/product/delivery-info"
import { ProductCard } from "@/components/product/product-card"
import { ProductGallery } from "@/components/product/product-gallery"
import { ProductPurchase } from "@/components/product/product-purchase"
import { ProductTabs } from "@/components/product/product-tabs"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { Skeleton } from "@/components/ui/skeleton"
import { siteConfig } from "@/config/site"
import {
  getAllProductSlugs,
  getProductBySlug,
  getProductReviews,
  getRelatedProducts,
} from "@/lib/data"
import { formatPrice } from "@/lib/format"

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}
  const title = product.metaTitle || product.name
  const description =
    product.metaDescription ||
    `${product.name} — ${formatPrice(product.price)}. ${product.category.name}. Cash on Delivery nationwide.`
  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    // Hidden products open by direct link but stay out of search engines
    ...(product.status === "hidden" && { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      images: product.images.map((i) => ({ url: i.url, alt: i.alt ?? product.name })),
    },
  }
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <div className="shop-container py-6">
      <Suspense fallback={<ProductPageSkeleton />}>
        <ProductDetails params={params} />
      </Suspense>
    </div>
  )
}

function ProductPageSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-5 w-48" />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-3">
          <Skeleton className="aspect-4/5 w-full rounded-xl" />
          <div className="flex gap-2.5">
            <Skeleton className="h-20 w-16 rounded-md sm:h-24 sm:w-20" />
            <Skeleton className="h-20 w-16 rounded-md sm:h-24 sm:w-20" />
            <Skeleton className="h-20 w-16 rounded-md sm:h-24 sm:w-20" />
            <Skeleton className="h-20 w-16 rounded-md sm:h-24 sm:w-20" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

async function ProductDetails({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const [related, reviews] = await Promise.all([
    getRelatedProducts(product, 10),
    getProductReviews(product),
  ])

  // Google rich results (price, stock, rating in search)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => i.url),
    description: product.description,
    sku: product.id,
    brand: { "@type": "Brand", name: product.brand?.name ?? siteConfig.name },
    aggregateRating: product.reviewCount
      ? {
          "@type": "AggregateRating",
          ratingValue: product.rating,
          reviewCount: product.reviewCount,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      url: `${siteConfig.url}/products/${product.slug}`,
      priceCurrency: "BDT",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Breadcrumbs
        items={[
          { label: product.category.name, href: `/category/${product.category.slug}` },
          { label: product.name },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} name={product.name} />

        <div className="space-y-6">
          <div className="space-y-2">
            <Link
              href={`/category/${product.category.slug}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              {product.category.name}
            </Link>
            <h1 className="font-display text-2xl leading-tight font-bold md:text-3xl">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {product.rating ? (
                <span className="flex items-center gap-1">
                  <Star className="size-4 fill-foreground text-foreground" />
                  <span className="font-medium text-foreground">
                    {product.rating.toFixed(1)}
                  </span>
                  ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})
                </span>
              ) : null}
              <span>SKU: {product.id.toUpperCase()}</span>
              {product.brand && <span>Brand: {product.brand.name}</span>}
            </div>
          </div>

          <ProductPurchase product={product} />
          <DeliveryInfo />
        </div>
      </div>

      <section className="mt-12 md:mt-16">
        <ProductTabs product={product} reviews={reviews} />
      </section>

      {related.length > 0 && (
        <section className="mt-12 md:mt-16">
          <SectionHeader
            title="You May Also Like"
            subtitle={`More from ${product.category.name}`}
            href={`/category/${product.category.slug}`}
          />
          <ProductCarousel>
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductCarousel>
        </section>
      )}
    </>
  )
}
