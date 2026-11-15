import { z } from "zod"

import { bdPhoneSchema } from "./common"

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.email("Please enter a valid email").optional().or(z.literal("")),
})

export const addressSchema = z.object({
  label: z.string().trim().min(1, "Please add a label (e.g. Home, Office)").max(30),
  fullName: z.string().trim().min(2, "Please enter a name").max(80),
  phone: bdPhoneSchema,
  division: z.string().min(1, "Please select a division"),
  district: z.string().min(1, "Please select a district"),
  upazila: z.string().min(1, "Please select an upazila/thana"),
  address: z.string().trim().min(5, "Please enter your full address"),
  isDefault: z.boolean(),
})

export type ProfileInput = z.input<typeof profileSchema>
export type AddressInput = z.input<typeof addressSchema>
