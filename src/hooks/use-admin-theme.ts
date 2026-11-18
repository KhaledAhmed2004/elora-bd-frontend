import { useLayoutEffect } from "react"

/**
 * Switches <body> to the admin palette (globals.css → body.admin-theme) while
 * an admin screen is visible. Next keeps visited routes mounted but hidden
 * (Activity); effects are cleaned up when hidden, so the storefront never
 * inherits the admin colours.
 */
export function useAdminTheme() {
  useLayoutEffect(() => {
    document.body.classList.add("admin-theme")
    return () => document.body.classList.remove("admin-theme")
  }, [])
}
