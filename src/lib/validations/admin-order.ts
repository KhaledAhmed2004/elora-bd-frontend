import { z } from "zod"

import { adminBdPhoneSchema } from "./common"

const money = z.number({ error: "Enter a number" }).min(0, "Must be 0 or more")

export const adminOrderSchema = z
  .object({
    source: z.enum(["website", "facebook", "whatsapp", "phone", "instagram"]),
    phone: adminBdPhoneSchema,
    fullName: z.string().trim().min(2, "Enter a name"),
    division: z.string().min(1, "Select a division"),
    district: z.string().min(1, "Select a district"),
    upazila: z.string().min(1, "Select an upazila/thana"),
    address: z.string().trim().min(5, "Enter the full address"),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, "This product was deleted — remove the line"),
          variantId: z.string().nullable(),
          name: z.string(),
          image: z.string(),
          price: z
            .number({ error: "Enter a price" })
            .positive("Price must be more than 0"),
          quantity: z.number({ error: "Qty" }).int().min(1, "Min 1"),
        })
      )
      .min(1, "Add at least one product"),
    deliveryCharge: money,
    discount: money,
    paymentMethod: z.enum(["cod", "bkash", "nagad", "sslcommerz"]),
    status: z.enum(["pending", "confirmed"]),
    note: z.string().max(300).optional(),
    adminNote: z.string().max(500).optional(),
    advanceAmount: money.optional(),
    advanceMethod: z.enum(["bkash", "nagad"]),
    advanceTrxId: z.string().trim().max(40).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.advanceAmount && v.advanceAmount > 0 && !v.advanceTrxId) {
      ctx.addIssue({
        code: "custom",
        path: ["advanceTrxId"],
        message: "Enter the transaction ID",
      })
    }
  })

export type AdminOrderValues = z.output<typeof adminOrderSchema>
