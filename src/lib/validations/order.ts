import { z } from "zod"

import { bdPhoneSchema } from "./common"

export const trackOrderSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^BD-\d{6}$/, "Please enter a valid order number (e.g. BD-123456)"),
  phone: bdPhoneSchema,
})

export type TrackOrderInput = z.input<typeof trackOrderSchema>
