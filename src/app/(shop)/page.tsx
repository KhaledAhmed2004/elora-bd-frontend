import { Zap } from "lucide-react"
import Link from "next/link"

import { CategoryGrid } from "@/components/home/category-grid"
import { Countdown } from "@/components/home/countdown"
import { HeroSlider } from "@/components/home/hero-slider"
import { ProductCarousel } from "@/components/home/product-carousel"
import { PromoBanners } from "@/components/home/promo-banners"
import { SectionHeader } from "@/components/home/section-header"
import { WornAndLoved, type WornAndLovedPost } from "@/components/home/worn-and-loved"
import { Reveal } from "@/components/motion/reveal"
import { ProductCard } from "@/components/product/product-card"
import { heroBanners } from "@/data/banners"
import { wornAndLovedHandles } from "@/data/worn-and-loved"
import {
  getBanners,
  getBestSellers,
  getCategories,
  getFeaturedProducts,
  getFlashSaleProducts,
  getNewArrivals,
} from "@/lib/data"

export default async function HomePage() {
  const [banners, categories, flashSale, newArrivals, bestSellers, featured] =
    await Promise.all([
      getBanners(),
      getCategories(),
      getFlashSaleProducts(10),
      getNewArrivals(10),
      getBestSellers(10),
      getFeaturedProducts(10),
    ])

  // "Worn & Loved" posts: best sellers first, then featured, one post per product
  const seen = new Set<string>()
  const wornAndLoved: WornAndLovedPost[] = [...bestSellers, ...featured]
    .filter((p) => p.images[0] && !seen.has(p.id) && seen.add(p.id))
    .slice(0, wornAndLovedHandles.length)
    .map((p, i) => ({
      id: p.id,
      handle: wornAndLovedHandles[i],
      caption: p.category.name,
      image: p.images[0].url,
      alt: p.images[0].alt ?? p.name,
      href: `/products/${p.slug}`,
    }))

  return (
    <div className="shop-container space-y-12 py-4 md:space-y-16 md:py-6">
      <HeroSlider banners={banners.length ? banners : heroBanners} />

      <Reveal>
        <section>
          <SectionHeader title="Shop by Category" href="/products" />
          <CategoryGrid categories={categories} />
        </section>
      </Reveal>

      {/* Flash sale */}
      <Reveal>
        <section className="rounded-2xl bg-blush-soft p-4 ring-1 ring-blush md:p-6 dark:ring-gold/20">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <h2 className="flex items-center gap-2 font-display text-2xl font-bold md:text-3xl">
                <Zap className="size-6 fill-gold text-gold" />
                Flash Sale
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Ends in <Countdown />
              </div>
            </div>
            <Link
              href="/products?sort=price-asc"
              className="text-sm font-medium text-gold-ink hover:underline"
            >
              See All Offers →
            </Link>
          </div>
          <ProductCarousel>
            {flashSale.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 2} />
            ))}
          </ProductCarousel>
        </section>
      </Reveal>

      <section>
        <Reveal>
          <SectionHeader
            title="New Arrivals"
            subtitle="Just arrived this week"
            href="/products?sort=newest"
          />
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {newArrivals.map((p, i) => (
            <Reveal key={p.id} delay={(i % 5) * 0.07} className="grid">
              <ProductCard product={p} priority={i < 2} />
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal>
        <PromoBanners />
      </Reveal>

      <Reveal>
        <section>
          <SectionHeader
            title="Best Selling"
            subtitle="Our customers' favorites"
            href="/products?sort=popular"
          />
          <ProductCarousel>
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductCarousel>
        </section>
      </Reveal>

      <section>
        <Reveal>
          <SectionHeader title="Our Special Collection" href="/products" />
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={(i % 5) * 0.07} className="grid">
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal>
        <WornAndLoved posts={wornAndLoved} />
      </Reveal>
    </div>
  )
}
