/**
 * Phone + OTP auth. MOCK implementation: no SMS is sent and the OTP is always
 * 123456. Replace with:
 *   POST /auth/otp/request  { phone }
 *   POST /auth/otp/verify   { phone, otp }  -> { user, accessToken }
 */
import { useAuthStore } from "@/store/auth-store"
import type { User } from "@/types"

export const MOCK_OTP = "123456"
export const OTP_RESEND_SECONDS = 60

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function requestOtp(_phone: string): Promise<void> {
  await wait(600)
}

export async function verifyOtp(phone: string, otp: string): Promise<User> {
  await wait(600)
  if (otp !== MOCK_OTP) throw new Error("Incorrect OTP. Please try again.")
  const known = useAuthStore.getState().knownProfiles[phone]
  return {
    id: `u-${phone}`,
    phone,
    name: known?.name ?? "",
    email: known?.email ?? null,
    role: "customer",
  }
}
