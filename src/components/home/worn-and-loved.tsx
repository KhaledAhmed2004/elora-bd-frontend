"use client"

import Autoplay from "embla-carousel-autoplay"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowLeft, ArrowRight, Heart, MessageCircle, Send, ShoppingBag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

export interface WornAndLovedPost {
  id: string
  handle: string
  caption: string
  image: string
  alt: string
  href: string
}

/**
 * Instagram-style "Worn & Loved" rail: centered looping carousel where the
 * active post is fully opaque and the side posts are faded.
 */
export function WornAndLoved({ posts }: { posts: WornAndLovedPost[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center", skipSnaps: false },
    [Autoplay({ delay: 4500, stopOnInteraction: false, stopOnMouseEnter: true })]
  )
  const [selected, setSelected] = useState(0)
  const [liked, setLiked] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap())
    onSelect()
    emblaApi.on("select", onSelect).on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect)
    }
  }, [emblaApi])

  const share = useCallback(async (post: WornAndLovedPost) => {
    const url = new URL(post.href, window.location.origin).toString()
    try {
      if (navigator.share) {
        await navigator.share({ title: post.alt, url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success("Link copied")
      }
    } catch {
      // user cancelled the share sheet
    }
  }, [])

  if (!posts.length) return null

  return (
    <section aria-roledescription="carousel" aria-label="Worn and Loved">
      <div className="relative mb-6 flex items-center justify-center">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold md:text-3xl">
          Worn &amp; Loved
          <Heart className="size-6 fill-blush-deep text-blush-deep md:size-7" aria-hidden />
        </h2>
        <div className="absolute right-0 hidden gap-1 sm:flex">
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Previous post"
            className="rounded-full p-2 transition-colors hover:bg-blush-soft"
          >
            <ArrowLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Next post"
            className="rounded-full p-2 transition-colors hover:bg-blush-soft"
          >
            <ArrowRight className="size-5" />
          </button>
        </div>
      </div>

      <div ref={emblaRef} className="-mx-4 overflow-hidden md:mx-0">
        <div className="-ml-4 flex touch-pan-y">
          {posts.map((post, i) => {
            const active = i === selected
            const isLiked = liked[post.id] ?? false
            return (
              <div
                key={post.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${posts.length}`}
                className="min-w-0 shrink-0 grow-0 basis-[78%] pl-4 sm:basis-[45%] md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
              >
                <article
                  className={cn(
                    "overflow-hidden rounded-2xl bg-card ring-1 ring-border transition-all duration-500",
                    active ? "opacity-100 shadow-lg" : "opacity-55"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <span className="rounded-full bg-gold-gradient p-[2px]">
                      <span className="flex size-8 items-center justify-center rounded-full bg-blush-soft text-xs font-semibold uppercase text-espresso ring-2 ring-card">
                        {post.handle.charAt(0)}
                      </span>
                    </span>
                    <div className="min-w-0 leading-tight">
                      <p className="truncate text-xs font-semibold">{post.handle}</p>
                      <p className="truncate text-xs text-muted-foreground">{post.caption}</p>
                    </div>
                  </div>

                  {/* Photo */}
                  <Link href={post.href} className="relative block aspect-3/4 bg-muted" tabIndex={-1}>
                    <Image
                      src={post.image}
                      alt={post.alt}
                      fill
                      sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 78vw"
                      className="object-cover"
                    />
                  </Link>

                  {/* Actions */}
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        aria-label={isLiked ? "Unlike" : "Like"}
                        aria-pressed={isLiked}
                        onClick={() => setLiked((s) => ({ ...s, [post.id]: !isLiked }))}
                        className="transition-transform active:scale-90"
                      >
                        <Heart
                          className={cn(
                            "size-5",
                            isLiked ? "fill-red-500 text-red-500" : "text-foreground/70"
                          )}
                        />
                      </button>
                      <Link href={post.href} aria-label="View reviews">
                        <MessageCircle className="size-5 text-foreground/70" />
                      </Link>
                      <button type="button" aria-label="Share" onClick={() => share(post)}>
                        <Send className="size-5 text-foreground/70" />
                      </button>
                    </div>
                    <Link
                      href={post.href}
                      className="flex items-center gap-1.5 text-xs font-medium hover:text-gold-ink"
                    >
                      Shop Now
                      <ShoppingBag className="size-5" />
                    </Link>
                  </div>
                </article>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
