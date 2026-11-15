import { z } from "zod"

const money = (msg: string) =>
  z.number({ error: msg }).positive("Must be more than 0").max(10_000_000)

export const productSchema = z
  .object({
    name: z.string().trim().min(3, "Enter the product name").max(120),
    slug: z
      .string()
      .trim()
      .min(3, "Slug is required")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Only lowercase letters, numbers and hyphens (e.g. red-saree)"
      ),
    category: z.string().min(1, "Select a category"),
    brand: z.string().trim().max(60).optional(),
    price: money("Enter a price"),
    comparePrice: money("Enter a valid price").optional(),
    costPrice: z.number().min(0, "Must be 0 or more").optional(),
    hasSizes: z.boolean(),
    hasColors: z.boolean(),
    stock: z.number({ error: "Enter the stock" }).int().min(0, "Must be 0 or more"),
    variants: z.array(
      z.object({
        color: z.string().trim().max(30),
        size: z.string().trim().max(20),
        stock: z.number({ error: "Stock" }).int().min(0),
      })
    ),
    images: z
      .array(z.object({ url: z.url("Enter a valid image URL") }))
      .min(1, "At least one image is required"),
    description: z
      .string()
      .trim()
      .min(10, "Write a description of at least 10 characters"),
    isFeatured: z.boolean(),
    isNew: z.boolean(),
    status: z.enum(["active", "hidden", "draft"]),
    metaTitle: z.string().trim().max(70, "Keep it under 70 characters").optional(),
    metaDescription: z
      .string()
      .trim()
      .max(160, "Keep it under 160 characters")
      .optional(),
  })
  .superRefine((v, ctx) => {
    if (v.comparePrice != null && v.comparePrice <= v.price) {
      ctx.addIssue({
        code: "custom",
        path: ["comparePrice"],
        message: "Compare-at price must be higher than the current price",
      })
    }
    if (!v.hasSizes && !v.hasColors) return
    if (v.variants.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["variants"],
        message: "Add at least one variant",
      })
      return
    }
    v.variants.forEach((x, i) => {
      if (v.hasColors && !x.color)
        ctx.addIssue({ code: "custom", path: ["variants", i, "color"], message: "Color" })
      if (v.hasSizes && !x.size)
        ctx.addIssue({ code: "custom", path: ["variants", i, "size"], message: "Size" })
    })
    const keys = v.variants.map(
      (x) =>
        `${v.hasColors ? x.color.toLowerCase() : ""}|${v.hasSizes ? x.size.toUpperCase() : ""}`
    )
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({
        code: "custom",
        path: ["variants"],
        message: "The same color/size combination cannot be added twice",
      })
    }
  })

export type ProductFormInput = z.input<typeof productSchema>
export type ProductFormValues = z.output<typeof productSchema>
