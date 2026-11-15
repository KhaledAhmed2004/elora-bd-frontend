"use client"

import "lenis/dist/lenis.css"

import { ReactLenis } from "lenis/react"

/**
 * Inertia-based smooth scrolling for the whole page (window scroll).
 *
 * - Nested scroll areas (cart drawer, dialogs, dropdowns) keep native scroll.
 * - While Radix locks the body (`data-scroll-locked`), Lenis steps aside so the
 *   page behind an open sheet/dialog does not move.
 * - `prefers-reduced-motion` is honoured by Lenis by default.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.09,
        wheelMultiplier: 1,
        allowNestedScroll: true,
        stopInertiaOnNavigate: true,
        prevent: (node) =>
          document.body.hasAttribute("data-scroll-locked") ||
          !!node.closest?.('[role="dialog"], [data-radix-popper-content-wrapper]'),
      }}
    >
      {children}
    </ReactLenis>
  )
}
