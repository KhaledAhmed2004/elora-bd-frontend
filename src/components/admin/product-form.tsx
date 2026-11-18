"use client"

import { useFieldId } from "@/hooks/use-field-id"
import { zodResolver } from "@hookform/resolvers/zod"
import { ImagePlus, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { siteConfig } from "@/config/site"
import {
  adminActions,
  type AdminProduct,
  adminQueries,
  type ProductInput,
  useAdminMutation,
  useAdminQuery,
} from "@/lib/admin/queries"
import { isApiStatus } from "@/lib/api"
import { slugify } from "@/lib/format"
import { productSchema, type ProductFormValues } from "@/lib/validations/product"
import { cn } from "@/lib/utils"
import { colorHex, titleCase } from "@/lib/variants"
import type { ProductStatus } from "@/types"

type Product = AdminProduct

/** <input type="number"> ↔ number | undefined */
const numberProps = (
  value: number | undefined,
  onChange: (v: number | undefined) => void
) => ({
  type: "number" as const,
  inputMode: "numeric" as const,
  value: value ?? "",
  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange(e.target.value === "" ? undefined : Number(e.target.value)),
})

function toFormValues(p?: Product) {
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    // Holds the category id
    category: p?.category.id ?? "",
    brand: p?.brand?.name ?? "",
    price: p?.price ?? (undefined as unknown as number),
    comparePrice: p?.comparePrice ?? undefined,
    costPrice: p?.costPrice ?? undefined,
    hasSizes: Boolean(p?.variants?.some((v) => v.size)),
    hasColors: Boolean(p?.variants?.some((v) => v.color)),
    stock: p && !p.variants?.length ? p.stock : 0,
    variants:
      p?.variants?.map((v) => ({
        color: v.color ?? "",
        size: v.size ?? "",
        stock: v.stock,
      })) ?? [],
    images: p?.images.map((i) => ({ url: i.url })) ?? [{ url: "" }],
    description: p?.description ?? "",
    isFeatured: p?.isFeatured ?? false,
    isNew: p?.isNew ?? true,
    status: p?.status ?? ("active" as ProductStatus),
    metaTitle: p?.metaTitle ?? "",
    metaDescription: p?.metaDescription ?? "",
  }
}

const STATUS_OPTIONS: { value: ProductStatus; label: string; text: string }[] = [
  { value: "active", label: "Active", text: "Visible in the shop" },
  { value: "hidden", label: "Hidden", text: "Not listed — opens only by direct link" },
  { value: "draft", label: "Draft", text: "Not visible to customers at all" },
]

const splitList = (s: string) => [
  ...new Set(
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
  ),
]

/**
 * Form values → API body. Existing variants are sent with their id (matched by
 * colour + size) so the API keeps them — past orders keep pointing at them.
 */
function toInput(v: ProductFormValues, existing?: Product): ProductInput {
  const used = new Set<string>()
  const variants =
    v.hasSizes || v.hasColors
      ? v.variants.map((x) => {
          const color = v.hasColors ? titleCase(x.color) : null
          const size = v.hasSizes ? x.size.trim().toUpperCase() : null
          const prev = existing?.variants.find(
            (ev) =>
              !used.has(ev.id) &&
              (ev.color ?? null) === color &&
              (ev.size ?? null) === size
          )
          if (prev) used.add(prev.id)
          return { id: prev?.id, color, size, stock: x.stock }
        })
      : []
  return {
    name: v.name,
    slug: v.slug,
    description: v.description,
    categoryId: v.category,
    brand: v.brand || null,
    price: v.price,
    comparePrice: v.comparePrice ?? null,
    costPrice: v.costPrice ?? null,
    stock: variants.length ? 0 : v.stock,
    variants,
    images: v.images.map((i) => ({ url: i.url, alt: v.name })),
    status: v.status.toUpperCase() as ProductInput["status"],
    isFeatured: v.isFeatured,
    isNew: v.isNew,
    metaTitle: v.metaTitle || null,
    metaDescription: v.metaDescription || null,
  }
}

export function ProductForm({ product }: { product?: Product }) {
  const fid = useFieldId()
  const router = useRouter()
  const { data: categoryRows = [] } = useAdminQuery(
    ["categories"],
    adminQueries.categories
  )
  // Sub-categories listed under their parent: "Saree › Jamdani"
  const categories = categoryRows
    .filter((c) => !c.parentId)
    .flatMap((parent) => [
      { id: parent.id, name: parent.name },
      ...categoryRows
        .filter((c) => c.parentId === parent.id)
        .map((c) => ({ id: c.id, name: `${parent.name} › ${c.name}` })),
    ])
  const form = useForm({
    resolver: zodResolver(productSchema),
    mode: "onTouched",
    defaultValues: toFormValues(product),
  })
  const variants = useFieldArray({ control: form.control, name: "variants" })
  const images = useFieldArray({ control: form.control, name: "images" })
  const [
    hasSizes,
    hasColors,
    imageValues,
    variantValues,
    nameValue,
    slugValue,
    metaTitleValue,
    metaDescriptionValue,
  ] = useWatch({
    control: form.control,
    name: [
      "hasSizes",
      "hasColors",
      "images",
      "variants",
      "name",
      "slug",
      "metaTitle",
      "metaDescription",
    ],
  })
  const hasVariants = hasSizes || hasColors
  const gridCols =
    hasColors && hasSizes ? "grid-cols-[1.4fr_1fr_1fr_auto]" : "grid-cols-[1fr_1fr_auto]"
  const err = form.formState.errors
  const [colorList, setColorList] = useState("")
  const [sizeList, setSizeList] = useState("")

  /** Build every colour × size row; keeps the stock of rows that already exist */
  function generateVariants() {
    const colors = hasColors ? splitList(colorList).map(titleCase) : [""]
    const sizes = hasSizes ? splitList(sizeList).map((s) => s.toUpperCase()) : [""]
    if (!colors.length || !sizes.length) {
      toast.error(hasColors && !colors.length ? "Enter some colors" : "Enter some sizes")
      return
    }
    const old = form.getValues("variants")
    const rows = colors.flatMap((color) =>
      sizes.map((size) => ({
        color,
        size,
        stock:
          old.find((o) => titleCase(o.color) === color && o.size.toUpperCase() === size)
            ?.stock ?? 0,
      }))
    )
    variants.replace(rows)
  }

  const save = useAdminMutation(
    (body: ProductInput) =>
      product
        ? adminActions.updateProduct(product.id, body)
        : adminActions.createProduct(body),
    {
      invalidate: [["products"], ["dashboard"], ["categories"]],
      success: product ? "Product updated" : "Product added",
      shop: ["catalog"],
      onSuccess: () => {
        // Next keeps this page mounted (hidden) — start fresh next time "New product" opens
        if (!product) form.reset(toFormValues())
        router.push("/admin/products")
      },
    }
  )

  const onSubmit = form.handleSubmit((v) =>
    save.mutate(toInput(v, product), {
      onError: (e) => {
        if (isApiStatus(e, 409)) {
          form.setError("slug", {
            message: "This slug is already used by another product",
          })
        }
      },
    })
  )

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <Card title="Basic Info">
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={fid("name")}>Product name *</FieldLabel>
                <Input
                  {...field}
                  id={fid("name")}
                  aria-invalid={fieldState.invalid}
                  onChange={(e) => {
                    field.onChange(e)
                    // Auto-fill slug for new products until the admin edits it
                    if (!product && !form.getFieldState("slug").isDirty) {
                      form.setValue("slug", slugify(e.target.value))
                    }
                  }}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="slug"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={fid("slug")}>URL Slug *</FieldLabel>
                <Input {...field} id={fid("slug")} aria-invalid={fieldState.invalid} />
                <FieldDescription>/products/{field.value || "..."}</FieldDescription>
                {product && field.value !== product.slug && (
                  <p className="text-xs text-amber-600">
                    Changing the slug breaks old links (Facebook posts, Google). Add a
                    redirect from /products/{product.slug} once the backend exists.
                  </p>
                )}
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={fid("description")}>Description *</FieldLabel>
                <Textarea
                  {...field}
                  id={fid("description")}
                  rows={5}
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </Card>

        <Card title="Images">
          <ul className="space-y-3">
            {images.fields.map((f, i) => {
              const url = imageValues?.[i]?.url
              const valid = Boolean(url) && !err.images?.[i]?.url
              return (
                <li key={f.id} className="flex items-start gap-3">
                  <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                    {valid ? (
                      <Image
                        src={url!}
                        alt=""
                        fill
                        sizes="56px"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <ImagePlus className="size-5 text-muted-foreground" />
                    )}
                  </span>
                  <Controller
                    control={form.control}
                    name={`images.${i}.url`}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className="flex-1">
                        <Input
                          {...field}
                          placeholder="https://..."
                          aria-label={`Image ${i + 1} URL`}
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove image"
                    disabled={images.fields.length === 1}
                    onClick={() => images.remove(i)}
                  >
                    <Trash2 />
                  </Button>
                </li>
              )
            })}
          </ul>
          <FieldError
            errors={
              err.images?.root
                ? [err.images.root]
                : err.images?.message
                  ? [{ message: err.images.message }]
                  : undefined
            }
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => images.append({ url: "" })}
            >
              <Plus /> Add image
            </Button>
            <p className="text-xs text-muted-foreground">
              Enter image URLs for now. Direct uploads (Cloudinary) will be available once
              the backend is connected.
            </p>
          </div>
        </Card>

        <Card title="Stock & Variants">
          {(["hasColors", "hasSizes"] as const).map((name) => (
            <Controller
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {name === "hasColors"
                        ? "Does this product come in colors?"
                        : "Does this product have sizes?"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {name === "hasColors"
                        ? "E.g. Maroon, Navy, Golden"
                        : "E.g. S, M, L or 36, 37, 38"}
                    </p>
                  </div>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(on) => {
                      field.onChange(on)
                      const other = name === "hasColors" ? hasSizes : hasColors
                      if (on && !other && variants.fields.length === 0) {
                        const defaults =
                          name === "hasSizes" ? ["M", "L", "XL"] : ["Black", "Maroon"]
                        variants.replace(
                          defaults.map((x) => ({
                            color: name === "hasColors" ? x : "",
                            size: name === "hasSizes" ? x : "",
                            stock: 0,
                          }))
                        )
                      }
                    }}
                    aria-label={name === "hasColors" ? "Has colors" : "Has sizes"}
                  />
                </div>
              )}
            />
          ))}
          {hasVariants ? (
            <div className="space-y-3">
              <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium">
                  Quick fill — creates one row for every combination
                </p>
                <div className="flex flex-wrap items-end gap-2">
                  {hasColors && (
                    <Input
                      value={colorList}
                      onChange={(e) => setColorList(e.target.value)}
                      placeholder="Colors: Maroon, Navy, Golden"
                      aria-label="Colors, comma separated"
                      className="min-w-48 flex-1 bg-background"
                    />
                  )}
                  {hasSizes && (
                    <Input
                      value={sizeList}
                      onChange={(e) => setSizeList(e.target.value)}
                      placeholder="Sizes: M, L, XL"
                      aria-label="Sizes, comma separated"
                      className="min-w-40 flex-1 bg-background"
                    />
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateVariants}
                  >
                    Generate
                  </Button>
                </div>
              </div>
              <div
                className={cn(
                  "grid gap-2 text-xs font-medium text-muted-foreground",
                  gridCols
                )}
              >
                {hasColors && <span>Color</span>}
                {hasSizes && <span>Size</span>}
                <span>Stock</span>
                <span className="w-8" />
              </div>
              {variants.fields.map((f, i) => {
                const swatch = colorHex(variantValues?.[i]?.color ?? "")
                return (
                  <div key={f.id} className={cn("grid items-center gap-2", gridCols)}>
                    {hasColors && (
                      <div className="relative">
                        <span
                          aria-hidden
                          className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 rounded-full border"
                          style={{
                            background:
                              swatch ??
                              "repeating-linear-gradient(45deg,#ddd 0 3px,#fff 3px 6px)",
                          }}
                        />
                        <Input
                          {...form.register(`variants.${i}.color`)}
                          aria-label={`Variant ${i + 1} color`}
                          aria-invalid={Boolean(err.variants?.[i]?.color)}
                          className="pl-8 capitalize"
                        />
                      </div>
                    )}
                    {hasSizes && (
                      <Input
                        {...form.register(`variants.${i}.size`)}
                        aria-label={`Variant ${i + 1} size`}
                        aria-invalid={Boolean(err.variants?.[i]?.size)}
                        className="uppercase"
                      />
                    )}
                    <Controller
                      control={form.control}
                      name={`variants.${i}.stock`}
                      render={({ field, fieldState }) => (
                        <Input
                          {...numberProps(field.value, field.onChange)}
                          min={0}
                          aria-label={`Variant ${i + 1} stock`}
                          aria-invalid={fieldState.invalid}
                        />
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove variant"
                      onClick={() => variants.remove(i)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )
              })}
              <FieldError
                errors={
                  err.variants?.root
                    ? [err.variants.root]
                    : err.variants?.message
                      ? [{ message: err.variants.message }]
                      : undefined
                }
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => variants.append({ color: "", size: "", stock: 0 })}
                >
                  <Plus /> Add row
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  Total stock:{" "}
                  {(variantValues ?? []).reduce((s, x) => s + (x?.stock ?? 0), 0)}
                </span>
              </div>
            </div>
          ) : (
            <Controller
              control={form.control}
              name="stock"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="max-w-xs">
                  <FieldLabel htmlFor={fid("stock")}>Stock *</FieldLabel>
                  <Input
                    id={fid("stock")}
                    min={0}
                    {...numberProps(field.value, field.onChange)}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          )}
        </Card>

        <Card title="SEO (Google & Facebook preview)">
          <Controller
            control={form.control}
            name="metaTitle"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={fid("metaTitle")}>Meta title</FieldLabel>
                <Input
                  {...field}
                  id={fid("metaTitle")}
                  placeholder={nameValue || "Defaults to the product name"}
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>{(field.value ?? "").length}/70</FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="metaDescription"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={fid("metaDescription")}>Meta description</FieldLabel>
                <Textarea
                  {...field}
                  id={fid("metaDescription")}
                  rows={3}
                  placeholder="Short sales line shown under the title on Google"
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>{(field.value ?? "").length}/160</FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <SeoPreview
            title={metaTitleValue || nameValue || "Product name"}
            slug={slugValue}
            description={
              metaDescriptionValue ||
              "Cash on Delivery nationwide. Check the product before you pay."
            }
          />
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Pricing">
          <Controller
            control={form.control}
            name="price"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={fid("price")}>Selling price (৳) *</FieldLabel>
                <Input
                  id={fid("price")}
                  min={0}
                  {...numberProps(field.value, field.onChange)}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="comparePrice"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={fid("comparePrice")}>
                  Compare-at price (৳)
                </FieldLabel>
                <Input
                  id={fid("comparePrice")}
                  min={0}
                  {...numberProps(field.value, field.onChange)}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>
                  Shown struck through to indicate a discount
                </FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="costPrice"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={fid("costPrice")}>Cost price (৳)</FieldLabel>
                <Input
                  id={fid("costPrice")}
                  min={0}
                  {...numberProps(field.value, field.onChange)}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>
                  Visible to admins only — used for profit calculation
                </FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </Card>

        <Card title="Organize">
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={fid("status")}>Visibility</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={fid("status")} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {STATUS_OPTIONS.find((o) => o.value === field.value)?.text}
                </FieldDescription>
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="category"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={fid("category")}>Category *</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id={fid("category")}
                    className="w-full"
                    aria-invalid={fieldState.invalid}
                    onBlur={field.onBlur}
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Field>
            <FieldLabel htmlFor={fid("brand")}>Brand</FieldLabel>
            <Input id={fid("brand")} {...form.register("brand")} />
          </Field>
          {(["isFeatured", "isNew"] as const).map((name) => (
            <Controller
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <label className="flex items-center justify-between gap-3 text-sm">
                  {name === "isFeatured"
                    ? "Featured (shown on home page)"
                    : "New Arrival badge"}
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </label>
              )}
            />
          ))}
        </Card>

        <div className="flex gap-2 xl:sticky xl:top-20">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={save.isPending}>
            {product ? "Update product" : "Save product"}
          </Button>
        </div>
      </div>
    </form>
  )
}

/** Rough Google result preview */
function SeoPreview({
  title,
  slug,
  description,
}: {
  title: string
  slug?: string
  description: string
}) {
  return (
    <div className="rounded-lg border bg-background p-3" aria-label="Google preview">
      <p className="truncate text-xs text-muted-foreground">
        {siteConfig.url.replace(/^https?:\/\//, "")} › products › {slug || "..."}
      </p>
      <p className="truncate text-base text-[#1a0dab] dark:text-[#8ab4f8]">
        {title} | {siteConfig.name}
      </p>
      <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 admin-card p-4 md:p-5">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  )
}
