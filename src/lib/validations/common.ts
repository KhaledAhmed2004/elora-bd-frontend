import { z } from "zod"

/** Bangladeshi mobile: 01[3-9]XXXXXXXX (accepts +880 / 880 prefix) */
const makeBdPhoneSchema = (message: string) =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^\+?880/, "0"))
    .pipe(z.string().regex(/^01[3-9]\d{8}$/, message))

/** Storefront (customer-facing copy) */
export const bdPhoneSchema = makeBdPhoneSchema(
  "Please enter a valid mobile number (e.g. 01712345678)"
)

/** Admin panel (English copy) */
export const adminBdPhoneSchema = makeBdPhoneSchema(
  "Enter a valid mobile number (e.g. 01712345678)"
)

export const otpSchema = z.string().regex(/^\d{6}$/, "Please enter the 6-digit OTP")
