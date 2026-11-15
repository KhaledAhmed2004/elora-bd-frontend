"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { MotionConfig } from "motion/react"
import { ThemeProvider } from "next-themes"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getQueryClient } from "@/lib/query-client"

import { SmoothScroll } from "./smooth-scroll"

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <MotionConfig reducedMotion="user">
            <SmoothScroll>{children}</SmoothScroll>
          </MotionConfig>
          <Toaster position="top-center" richColors closeButton />
        </TooltipProvider>
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
