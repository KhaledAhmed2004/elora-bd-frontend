/**
 * API base URL.
 * - Browser: NEXT_PUBLIC_API_URL (the public API address)
 * - Server (SSR, cached fetches): API_URL if set (e.g. an internal address on the
 *   same machine/network), otherwise the public one
 */
export const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"

export const SERVER_API_URL = process.env.API_URL ?? PUBLIC_API_URL

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown
  ) {
    super(message)
  }
}

/** Server-side GET. `null` on 404, throws on anything else that isn't 2xx. */
export async function serverGet<T>(path: string): Promise<T | null> {
  const res = await fetch(`${SERVER_API_URL}${path}`, {
    headers: { Accept: "application/json" },
  })
  if (res.status === 404) return null
  if (!res.ok) {
    throw new ApiRequestError(`API ${res.status} on GET ${path}`, res.status)
  }
  return (await res.json()) as T
}
