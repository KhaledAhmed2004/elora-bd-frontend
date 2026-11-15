import axios from "axios"

import { PUBLIC_API_URL } from "@/lib/api-config"

/**
 * Browser → API client. Admin requests add their Bearer token in
 * src/lib/admin/admin-api.ts; refresh tokens are httpOnly cookies the browser
 * sends by itself (withCredentials).
 */
export const api = axios.create({
  baseURL: PUBLIC_API_URL,
  timeout: 15_000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

/** NestJS error body: message is a string or a list of validation messages */
interface NestErrorBody {
  message?: string | string[]
  statusCode?: number
}

/** Human-readable message from any API error */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<NestErrorBody>(error)) {
    if (!error.response) return "Please check your internet connection"
    if (error.response.status === 429) {
      return "Too many attempts. Please try again in a moment"
    }
    const m = error.response.data?.message
    if (Array.isArray(m)) return m[0] ?? "Please check the information you entered"
    return m ?? "Something went wrong. Please try again"
  }
  if (error instanceof Error) return error.message
  return "Something went wrong"
}

export const isApiStatus = (error: unknown, status: number) =>
  axios.isAxiosError(error) && error.response?.status === status
