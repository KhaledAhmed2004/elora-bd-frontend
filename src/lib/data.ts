/**
 * Storefront data layer — reads the backend API.
 * Every read is cached (`use cache`) with the "catalog" tag; admin changes call
 * `revalidateCatalog()` (src/app/actions/revalidate.ts) so the shop updates.
 */
import { cacheLife, cacheTag } from "next/cache"

import { serverGet } from "@/lib/api-config"
import type { ShopPopup } from "@/lib/popups"
import type { Category, Paginated, Product } from "@/types"

export type ProductSort = "newest" | "price-asc" | "price-desc" | "popular" | "discount"

export interface ProductQuery {
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  sizes?: string[]
  inStock?: boolean
  onSale?: boolean
  sort?: ProductSort
  page?: number
  limit?: number
}

export interface CategoryMatch {
  category: Category
  /** Set when `category` is a sub-category */
  parent?: Category
}

export interface ProductFacets {
  categories: { slug: string; name: string; count: number }[]
  sizes: string[]
  colors: string[]
  priceRange: { min: number; max: number }
}

export interface Review {
  id: string
  name: string
  rating: number
  text: string
  date: string
  verified: boolean
  /** The shop's public reply */
  reply?: string
}

export interface SearchSuggestion {
  id: string
  name: string
  slug: string
  price: number
  image?: string
}

const CATALOG = "catalog"

/** Menu tree: top-level categories with their sub-categories */
export async function getCategories(): Promise<Category[]> {
  "use cache"
  cacheLife("hours")
  cacheTag(CATALOG, "categories")
  return (await serverGet<Category[]>("/categories")) ?? []
}

/** Finds a top-level category or a sub-category by slug */
export async function getCategoryBySlug(
  slug: string
): Promise<CategoryMatch | undefined> {
  const tree = await getCategories()
  for (const cat of tree) {
    if (cat.slug === slug) return { category: cat }
    const child = cat.children?.find((c) => c.slug === slug)
    if (child) return { category: child, parent: cat }
  }
  return undefined
}

export async function getAllCategorySlugs(): Promise<string[]> {
  const tree = await getCategories()
  return tree.flatMap((c) => [c.slug, ...(c.children?.map((s) => s.slug) ?? [])])
}

function toSearchParams(q: ProductQuery) {
  const p = new URLSearchParams()
  if (q.search) p.set("q", q.search)
  if (q.category) p.set("category", q.category)
  if (q.minPrice != null) p.set("min", String(q.minPrice))
  if (q.maxPrice != null) p.set("max", String(q.maxPrice))
  if (q.sizes?.length) p.set("size", q.sizes.join(","))
  if (q.inStock) p.set("stock", "1")
  if (q.onSale) p.set("sale", "1")
  if (q.sort) p.set("sort", q.sort)
  p.set("page", String(q.page ?? 1))
  p.set("limit", String(q.limit ?? 12))
  return p.toString()
}

export async function getProducts(query: ProductQuery = {}): Promise<Paginated<Product>> {
  "use cache"
  cacheLife("minutes")
  cacheTag(CATALOG, "products")
  const res = await serverGet<Paginated<Product>>(`/products?${toSearchParams(query)}`)
  return (
    res ?? {
      data: [],
      meta: { page: 1, limit: query.limit ?? 12, total: 0, totalPages: 1 },
    }
  )
}

/** Options for the filter sidebar, based on category/search only */
export async function getProductFacets(
  query: Pick<ProductQuery, "category" | "search"> = {}
): Promise<ProductFacets> {
  "use cache"
  cacheLife("minutes")
  cacheTag(CATALOG, "products")
  const p = new URLSearchParams()
  if (query.category) p.set("category", query.category)
  if (query.search) p.set("q", query.search)
  return (
    (await serverGet<ProductFacets>(`/products/facets?${p}`)) ?? {
      categories: [],
      sizes: [],
      colors: [],
      priceRange: { min: 0, max: 0 },
    }
  )
}

/**
 * Slugs prerendered at build time: the best sellers (the rest render on first
 * visit). Cache Components needs at least one, so the build expects the API up.
 */
export async function getAllProductSlugs(): Promise<string[]> {
  const top = await getCollection("best-sellers", 30)
  return top.map((p) => p.slug)
}

/** Active or hidden (direct-link) products; drafts are `undefined` */
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  "use cache"
  cacheLife("minutes")
  cacheTag(CATALOG, "products", `product:${slug}`)
  return (await serverGet<Product>(`/products/${encodeURIComponent(slug)}`)) ?? undefined
}

type Collection = "featured" | "new-arrivals" | "best-sellers" | "flash-sale"

async function getCollection(name: Collection, limit: number): Promise<Product[]> {
  "use cache"
  cacheLife("minutes")
  cacheTag(CATALOG, "products")
  return (
    (await serverGet<Product[]>(`/products/collections/${name}?limit=${limit}`)) ?? []
  )
}

export const getFeaturedProducts = (limit = 8) => getCollection("featured", limit)
export const getNewArrivals = (limit = 8) => getCollection("new-arrivals", limit)
export const getBestSellers = (limit = 10) => getCollection("best-sellers", limit)
/** Biggest discounts in stock. A scheduled campaign can replace this later. */
export const getFlashSaleProducts = (limit = 10) => getCollection("flash-sale", limit)

export async function getRelatedProducts(
  product: Product,
  limit = 5
): Promise<Product[]> {
  "use cache"
  cacheLife("minutes")
  cacheTag(CATALOG, "products")
  return (
    (await serverGet<Product[]>(
      `/products/${encodeURIComponent(product.slug)}/related?limit=${limit}`
    )) ?? []
  )
}

/** Approved reviews (newest first), with the shop's replies */
export async function getProductReviews(product: Product): Promise<Review[]> {
  "use cache"
  cacheLife("minutes")
  cacheTag(CATALOG, "reviews", `reviews:${product.slug}`)
  return (
    (await serverGet<Review[]>(
      `/products/${encodeURIComponent(product.slug)}/reviews`
    )) ?? []
  )
}

export interface HomeBanner {
  id: string
  title: string
  subtitle?: string | null
  cta?: string | null
  href?: string | null
  image: string
}

export async function getBanners(): Promise<HomeBanner[]> {
  "use cache"
  cacheLife("hours")
  cacheTag(CATALOG, "banners")
  return (await serverGet<HomeBanner[]>("/banners")) ?? []
}

/**
 * Campaign popups that are on and not yet ended. The browser re-checks the
 * schedule, so a few minutes of cache never shows an ended campaign.
 */
export async function getLivePopups(): Promise<ShopPopup[]> {
  "use cache"
  cacheLife("minutes")
  cacheTag(CATALOG, "popups")
  return (await serverGet<ShopPopup[]>("/popups")) ?? []
}
