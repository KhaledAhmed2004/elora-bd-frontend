"use client"

import { motion } from "motion/react"

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Fades + lifts its children in once when they scroll into view.
 * Do not wrap above-the-fold LCP content (hero) — it starts hidden.
 */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: React.ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}
