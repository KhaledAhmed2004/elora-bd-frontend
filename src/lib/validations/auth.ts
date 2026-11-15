import { z } from "zod"

import { bdPhoneSchema, otpSchema } from "./common"

export const phoneLoginSchema = z.object({ phone: bdPhoneSchema })
export const verifyOtpSchema = z.object({ phone: bdPhoneSchema, otp: otpSchema })

export type PhoneLoginInput = z.input<typeof phoneLoginSchema>
export type VerifyOtpInput = z.input<typeof verifyOtpSchema>
