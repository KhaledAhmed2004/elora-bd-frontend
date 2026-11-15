import { useSyncExternalStore } from "react"

const noop = () => () => {}

/**
 * `false` during SSR and the hydration pass, `true` afterwards.
 * Use it before showing values that come from localStorage (cart count, wishlist)
 * so the server HTML and the first client render match.
 */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false
  )
}
