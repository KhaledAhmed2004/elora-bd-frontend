"use client"

import Autoplay from "embla-carousel-autoplay"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import type { HomeBanner } from "@/lib/data"
import { cn } from "@/lib/utils"

/** Active banners from the API, in the admin's order */
export function HeroSlider({ banners }: { banners: HomeBanner[] }) {
  // Lazy state keeps one stable plugin instance across renders
  const [autoplay] = useState(() =>
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  )
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  const onApi = useCallback((next: CarouselApi) => {
    setApi(next)
    if (!next) return
    setCurrent(next.selectedScrollSnap())
    next.on("select", () => setCurrent(next.selectedScrollSnap()))
  }, [])

  if (banners.length === 0) return null

  return (
    <Carousel
      setApi={onApi}
      opts={{ loop: true }}
      plugins={[autoplay]}
      className="group/hero overflow-hidden rounded-2xl"
      aria-label="Offer banner"
    >
      <CarouselContent className="ml-0">
        {banners.map((b, i) => (
          <CarouselItem key={b.id} className="pl-0">
            <div className="relative aspect-4/3 min-h-[280px] sm:aspect-2/1 sm:min-h-[320px] lg:aspect-[21/8] lg:min-h-0">
              <Image
                src={b.image}
                alt={b.title}
                fill
                preload={i === 0}
                sizes="(min-width: 1280px) 1248px, 100vw"
                className="object-cover object-[center_20%]"
              />
              <div className="absolute inset-0 bg-linear-to-r from-espresso/85 via-espresso/40 to-transparent" />
              <div className="absolute inset-0 flex items-end p-5 pb-11 sm:items-center sm:p-10 lg:p-16">
                <div className="max-w-md text-white">
                  <p className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-gold-light italic sm:mb-3 sm:text-base">
                    <span className="h-px w-8 bg-gold" />
                    Elora Fashion &amp; Lifestyle
                  </p>
                  <h2 className="font-display text-2xl leading-tight font-bold sm:text-4xl lg:text-5xl">
                    {b.title}
                  </h2>
                  {b.subtitle && (
                    <p className="mt-1.5 text-sm text-white/90 sm:mt-3 sm:text-base">
                      {b.subtitle}
                    </p>
                  )}
                  {b.href && (
                    <Button
                      asChild
                      size="lg"
                      className="mt-3 h-9 px-4 font-semibold text-espresso shadow-md transition-[filter] bg-gold-cta hover:brightness-105 sm:mt-6 sm:h-11 sm:px-6"
                    >
                      <Link href={b.href}>
                        {b.cta || "Shop Now"} <ArrowRight />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className="left-4 hidden border-none bg-white/80 opacity-0 transition-opacity group-hover/hero:opacity-100 md:flex" />
      <CarouselNext className="right-4 hidden border-none bg-white/80 opacity-0 transition-opacity group-hover/hero:opacity-100 md:flex" />

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:bottom-5">
        {banners.map((b, i) => (
          <button
            key={b.id}
            type="button"
            aria-label={`Slide ${i + 1}`}
            aria-current={i === current}
            onClick={() => api?.scrollTo(i)}
            className={cn(
              "h-2 rounded-full bg-white/60 transition-all",
              i === current ? "w-6 bg-gold-light" : "w-2"
            )}
          />
        ))}
      </div>
    </Carousel>
  )
}
