"use client"

import { Children } from "react"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

/**
 * Horizontal product rail. Children are rendered on the server (ProductCard)
 * and only wrapped here, so the cards stay Server Components.
 */
export function ProductCarousel({ children }: { children: React.ReactNode }) {
  return (
    <Carousel opts={{ align: "start", dragFree: true }} className="relative">
      <CarouselContent className="-ml-3 md:-ml-4">
        {Children.map(children, (child) => (
          <CarouselItem className="basis-[54%] pl-3 sm:basis-1/3 md:pl-4 lg:basis-1/4 xl:basis-1/5">
            {child}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="-left-4 hidden bg-background shadow-md disabled:hidden lg:flex" />
      <CarouselNext className="-right-4 hidden bg-background shadow-md disabled:hidden lg:flex" />
    </Carousel>
  )
}
