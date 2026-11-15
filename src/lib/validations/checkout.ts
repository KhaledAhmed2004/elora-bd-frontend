import { z } from "zod"

import { bdPhoneSchema } from "./common"

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(80),
  phone: bdPhoneSchema,
  email: z.email("Please enter a valid email").optional().or(z.literal("")),
  division: z.string().min(1, "Please select a division"),
  district: z.string().min(1, "Please select a district"),
  upazila: z.string().min(1, "Please select an upazila/thana"),
  address: z
    .string()
    .trim()
    .min(5, "Please enter your full address (house no., road, area)"),
  paymentMethod: z.enum(["cod", "bkash", "nagad", "sslcommerz"]),
  note: z.string().max(300).optional(),
  // Only required when the shop asks for an advance (checked in the form)
  advanceMethod: z.enum(["bkash", "nagad"]).optional(),
  advanceSender: z.string().trim().max(20).optional(),
  advanceTrxId: z.string().trim().max(40).optional(),
})

export type CheckoutInput = z.input<typeof checkoutSchema>
export type CheckoutValues = z.output<typeof checkoutSchema>
