"use client"

import { Minus, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface QuantityStepperProps {
  value: number
  max: number
  onChange: (value: number) => void
  size?: "sm" | "md"
  className?: string
}

export function QuantityStepper({
  value,
  max,
  onChange,
  size = "sm",
  className,
}: QuantityStepperProps) {
  const btn = size === "sm" ? "icon-sm" : "icon-lg"
  return (
    <div className={cn("inline-flex items-center rounded-lg border", className)}>
      <Button
        variant="ghost"
        size={btn}
        aria-label="Komao"
        onClick={() => onChange(value - 1)}
      >
        <Minus />
      </Button>
      <span
        className={cn(
          "text-center font-medium tabular-nums",
          size === "sm" ? "w-8 text-sm" : "w-10"
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <Button
        variant="ghost"
        size={btn}
        aria-label="Barao"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus />
      </Button>
    </div>
  )
}
