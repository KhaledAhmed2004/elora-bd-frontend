import {
  Barcode,
  Droplets,
  Layers,
  Palette,
  Ruler,
  Sparkles,
  Sun,
  Tag,
} from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Review } from "@/lib/data"
import type { Product } from "@/types"

import { ReviewSection } from "./review-section"

const SIZE_GUIDE = [
  { size: "S", bust: 34, waist: 28, length: 40 },
  { size: "M", bust: 36, waist: 30, length: 41 },
  { size: "L", bust: 38, waist: 32, length: 42 },
  { size: "XL", bust: 40, waist: 34, length: 43 },
  { size: "XXL", bust: 42, waist: 36, length: 44 },
]

const CARE_NOTES = [
  { icon: Droplets, title: "Gentle wash", text: "Hand wash in cold water" },
  { icon: Sun, title: "Shade dry", text: "Keeps the colors fresh longer" },
  { icon: Palette, title: "True to photo", text: "Shade may vary slightly by screen" },
]

const triggerClass =
  "h-12 flex-none rounded-none border-0 px-1 text-[15px] font-medium text-muted-foreground transition-colors data-active:text-foreground group-data-horizontal/tabs:after:bottom-[-1px] after:h-[2px]! after:rounded-full after:bg-primary!"

/** Unique values of one variant attribute, in first-seen order */
function variantValues(product: Product, key: string) {
  return [
    ...new Set((product.variants ?? []).map((v) => v.attributes[key]).filter(Boolean)),
  ]
}

export function ProductTabs({
  product,
  reviews,
}: {
  product: Product
  reviews: Review[]
}) {
  const sizes = variantValues(product, "size")
  const colors = variantValues(product, "color")
  const isClothing = sizes.some((s) => /^(S|M|L|XL|XXL)$/.test(s))

  const details = [
    { icon: Layers, label: "Category", value: product.category.name },
    product.brand && { icon: Tag, label: "Brand", value: product.brand.name },
    { icon: Barcode, label: "SKU", value: product.id.toUpperCase() },
  ].filter(Boolean) as { icon: typeof Tag; label: string; value: string }[]

  return (
    <Tabs defaultValue="description" className="gap-0">
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-7 overflow-x-auto overflow-y-hidden border-b p-0 [scrollbar-width:none] md:gap-10"
      >
        <TabsTrigger value="description" className={triggerClass}>
          Description
        </TabsTrigger>
        {isClothing && (
          <TabsTrigger value="size-guide" className={triggerClass}>
            Size Guide
          </TabsTrigger>
        )}
        <TabsTrigger value="reviews" className={triggerClass}>
          Reviews
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold tabular-nums text-secondary-foreground">
            {product.reviewCount ?? 0}
          </span>
        </TabsTrigger>
      </TabsList>

      {/* ---------- Description ---------- */}
      <TabsContent value="description" className="pt-8 md:pt-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:gap-8">
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-secondary/70 via-secondary/30 to-transparent p-6 md:p-8">
              <Sparkles
                aria-hidden
                className="absolute -top-3 -right-3 size-28 text-primary/5"
              />
              <p className="text-xs font-semibold tracking-[0.2em] text-secondary-foreground/70 uppercase">
                The details
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">
                About this piece
              </h2>
              <p className="mt-4 max-w-prose text-[15px] leading-7 whitespace-pre-line text-foreground/75">
                {product.description}
              </p>

              {(sizes.length > 0 || colors.length > 0) && (
                <div className="mt-6 flex flex-wrap gap-x-10 gap-y-5 border-t border-primary/10 pt-6">
                  {colors.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Colors
                      </p>
                      <ul className="flex flex-wrap gap-2">
                        {colors.map((c) => (
                          <li
                            key={c}
                            className="flex items-center gap-2 rounded-full border bg-background/80 py-1 pr-3 pl-1 text-sm"
                          >
                            <span
                              aria-hidden
                              className="size-5 rounded-full border border-black/10"
                              style={{ backgroundColor: c.toLowerCase() }}
                            />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {sizes.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Sizes
                      </p>
                      <ul className="flex flex-wrap gap-2">
                        {sizes.map((s) => (
                          <li
                            key={s}
                            className="flex h-8 min-w-10 items-center justify-center rounded-full border bg-background/80 px-3 text-sm font-medium"
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <ul className="grid gap-3 sm:grid-cols-3">
              {CARE_NOTES.map(({ icon: Icon, title, text }) => (
                <li
                  key={title}
                  className="group flex items-center gap-3.5 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="block text-xs leading-snug text-muted-foreground">
                      {text}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="h-fit overflow-hidden rounded-3xl border bg-card lg:sticky lg:top-24">
            <div className="bg-primary px-5 py-4 text-primary-foreground">
              <h3 className="font-display text-lg font-semibold">Product details</h3>
              <p className="text-xs text-primary-foreground/70">Everything at a glance</p>
            </div>
            <dl className="divide-y px-5 text-sm">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-3.5">
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="ml-auto text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </TabsContent>

      {/* ---------- Size guide ---------- */}
      {isClothing && (
        <TabsContent value="size-guide" className="pt-8 md:pt-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:gap-8">
            <div className="overflow-hidden rounded-3xl border">
              <div className="flex items-center gap-3 bg-secondary/50 px-5 py-4">
                <span className="flex size-10 items-center justify-center rounded-full bg-background text-secondary-foreground">
                  <Ruler className="size-5" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-semibold">Size chart</h2>
                  <p className="text-xs text-muted-foreground">All measurements in inches</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {["Size", "Bust", "Waist", "Length"].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {SIZE_GUIDE.map((r) => {
                      const available = sizes.includes(r.size)
                      return (
                        <tr key={r.size} className="transition-colors hover:bg-secondary/30">
                          <td className="px-5 py-3">
                            <span
                              className={
                                available
                                  ? "inline-flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                                  : "inline-flex size-9 items-center justify-center rounded-full border text-xs font-semibold text-muted-foreground"
                              }
                            >
                              {r.size}
                            </span>
                          </td>
                          <td className="px-5 py-3 tabular-nums">{r.bust}</td>
                          <td className="px-5 py-3 tabular-nums">{r.waist}</td>
                          <td className="px-5 py-3 tabular-nums">{r.length}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="h-fit space-y-4 rounded-3xl bg-secondary/40 p-6">
              <h3 className="font-display text-lg font-semibold">Find your fit</h3>
              <ol className="space-y-3 text-sm text-foreground/75">
                {[
                  ["Bust", "Measure around the fullest part of your chest."],
                  ["Waist", "Measure around your natural waistline."],
                  ["Between sizes?", "Pick the larger one for a relaxed fit."],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold">
                      {i + 1}
                    </span>
                    <span>
                      <span className="font-semibold text-foreground">{t}</span> — {d}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-block size-3 rounded-full bg-primary" /> Available in
                this product
              </p>
            </aside>
          </div>
        </TabsContent>
      )}

      {/* ---------- Reviews ---------- */}
      <TabsContent value="reviews" className="pt-8 md:pt-10">
        <ReviewSection
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            rating: product.rating,
            reviewCount: product.reviewCount,
          }}
          reviews={reviews}
        />
      </TabsContent>
    </Tabs>
  )
}
