import { useId } from "react"

/**
 * Unique, per-instance form field ids.
 *
 * With Cache Components, Next.js keeps up to 3 visited routes mounted (hidden via
 * React <Activity>). Hard-coded ids like id="phone" on /login, /checkout and
 * /track-order would then exist several times in the DOM, and a <label htmlFor>
 * could point at a hidden input. Use `fid("phone")` instead of "phone".
 */
export function useFieldId() {
  const uid = useId()
  return (name: string) => `${name}-${uid}`
}
