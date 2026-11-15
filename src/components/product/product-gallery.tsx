"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import type { Image as ProductImage } from "@/types"
import { cn } from "@/lib/utils"

export function ProductGallery({
  images,
  name,
}: {
  images: ProductImage[]
  name: string
}) {
  const [active, setActive] = useState(0)
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null)
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([])

  const current = images[active] ?? { url: "/placeholder.svg" }

  // Auto-scroll the active thumbnail into view if the list overflows horizontally
  useEffect(() => {
    thumbnailRefs.current[active]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    })
  }, [active])

  const handlePrev = () => {
    setActive((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActive((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main Image */}
      <div
        className="group relative aspect-4/5 w-full cursor-zoom-in overflow-hidden rounded-xl border bg-muted"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setZoom({
            x: ((e.clientX - r.left) / r.width) * 100,
            y: ((e.clientY - r.top) / r.height) * 100,
          })
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <Image
          src={current.url}
          alt={current.alt ?? name}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover transition-transform duration-200"
          style={
            zoom
              ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
              : undefined
          }
        />

        {/* Prev / Next navigation arrows when multiple images exist */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handlePrev()
              }}
              aria-label="Previous image"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow-sm backdrop-blur transition-opacity hover:bg-background opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleNext()
              }}
              aria-label="Next image"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow-sm backdrop-blur transition-opacity hover:bg-background opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row Underneath Main Image */}
      {images.length > 1 && (
        <div className="relative">
          <ul
            className="scrollbar-none flex gap-2.5 overflow-x-auto pb-1"
            aria-label="Product thumbnails"
          >
            {images.map((img, i) => (
              <li key={`${img.url}-${i}`} className="shrink-0">
                <button
                  ref={(el) => {
                    thumbnailRefs.current[i] = el
                  }}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Thumbnail ${i + 1}`}
                  aria-current={i === active}
                  className={cn(
                    "group relative block h-20 w-16 overflow-hidden rounded-md border-2 transition-all sm:h-24 sm:w-20",
                    i === active
                      ? "border-foreground ring-1 ring-foreground/20"
                      : "border-border/60 opacity-70 hover:border-foreground/50 hover:opacity-100"
                  )}
                >
                  <Image
                    src={img.url}
                    alt={img.alt ?? `${name} thumbnail ${i + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
