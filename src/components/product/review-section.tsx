"use client"

import { BadgeCheck, Star } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useFieldId } from "@/hooks/use-field-id"
import type { Review } from "@/lib/data"
import { getErrorMessage } from "@/lib/api"
import { formatDate, normalizeBdPhone } from "@/lib/format"
import { shopApi } from "@/lib/shop-api"
import { cn } from "@/lib/utils"
import type { Product } from "@/types"

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cn("flex gap-0.5", className)} aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  )
}

/** Approved reviews (already moderated by the API) + the review form */
export function ReviewSection({
  product,
  reviews,
}: {
  product: Pick<Product, "id" | "name" | "slug" | "rating" | "reviewCount">
  reviews: Review[]
}) {
  const rating = product.rating ?? 0
  const count = product.reviewCount ?? reviews.length

  return (
    <div className="space-y-8">
      <h2 className="font-display text-2xl font-bold md:text-3xl">
        Rating &amp; Reviews
      </h2>
      <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
          <div>
            <p className="flex items-end leading-none">
              <span className="text-7xl font-semibold tracking-tighter md:text-8xl">
                {rating.toFixed(1)}
              </span>
              <span className="mb-2 ml-1 text-2xl text-muted-foreground">/ 5</span>
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              ({count} {count === 1 ? "Review" : "Reviews"})
            </p>
          </div>
          <RatingBreakdown reviews={reviews} />
        </div>

        {reviews.length > 0 ? (
          <ReviewCarousel reviews={reviews} />
        ) : (
          <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            No reviews yet — be the first to share your thoughts.
          </div>
        )}
      </div>
      <ReviewForm product={product} />
    </div>
  )
}

function RatingBreakdown({ reviews }: { reviews: Review[] }) {
  const total = reviews.length
  const counts = [5, 4, 3, 2, 1].map((n) => ({
    star: n,
    count: reviews.filter((r) => Math.round(r.rating) === n).length,
  }))

  return (
    <ul className="w-full space-y-2.5 sm:w-72">
      {counts.map(({ star, count }) => {
        const pct = total ? (count / total) * 100 : 0
        return (
          <li key={star} className="flex items-center gap-2.5">
            <Star className="size-5 shrink-0 fill-amber-400 text-amber-400" />
            <span className="w-3 text-sm tabular-nums">{star}</span>
            <div
              className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted"
              role="meter"
              aria-label={`${star} star`}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={count}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-foreground"
                style={{ width: `max(${pct}%, 0.5rem)` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function ReviewCarousel({ reviews }: { reviews: Review[] }) {
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (!api) return
    const onSelect = () => setSelected(api.selectedScrollSnap())
    onSelect()
    api.on("select", onSelect)
    api.on("reInit", onSelect)
    return () => {
      api.off("select", onSelect)
      api.off("reInit", onSelect)
    }
  }, [api])

  const total = reviews.length
  const thumb = 100 / total

  return (
    <div className="relative min-w-0">
      <Carousel setApi={setApi} opts={{ align: "start", loop: total > 1 }}>
        <CarouselContent>
          {reviews.map((r) => (
            <CarouselItem key={r.id}>
              <article className="flex h-full flex-col rounded-2xl border bg-card p-5 pb-12 md:p-6 md:pb-12">
                <p className="flex items-center gap-1.5 font-semibold">
                  {r.name}
                  {r.verified && (
                    <span className="flex items-center gap-0.5 text-xs font-normal text-primary">
                      <BadgeCheck className="size-3.5" /> Verified
                    </span>
                  )}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex gap-1.5" aria-label={`${r.rating} out of 5`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "size-5",
                          i < Math.round(r.rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <time dateTime={r.date} className="text-sm text-muted-foreground">
                    {formatDate(r.date)}
                  </time>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{r.text}&rdquo;
                </p>
                {r.reply && (
                  <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm">
                    <span className="font-medium">Reply from the shop: </span>
                    {r.reply}
                  </p>
                )}
                <div
                  aria-hidden
                  className="mt-4 flex size-14 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground uppercase"
                >
                  {r.name.trim().charAt(0)}
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
        {total > 1 && (
          <>
            <CarouselPrevious className="-left-4 size-10 bg-background shadow-md disabled:hidden" />
            <CarouselNext className="-right-4 size-10 bg-background shadow-md" />
          </>
        )}
      </Carousel>
      {total > 1 && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-5 mx-auto h-1 w-36 overflow-hidden rounded-full bg-muted"
          aria-label={`Review ${selected + 1} of ${total}`}
        >
          <div
            className="h-full rounded-full bg-foreground transition-transform duration-300"
            style={{ width: `${thumb}%`, transform: `translateX(${selected * 100}%)` }}
          />
        </div>
      )}
    </div>
  )
}

function ReviewForm({ product }: { product: Pick<Product, "id" | "name" | "slug"> }) {
  const fid = useFieldId()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [text, setText] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Write a Review
      </Button>
    )
  }

  return (
    <form
      noValidate
      className="max-w-xl space-y-4 rounded-xl border p-4 md:p-5"
      onSubmit={async (e) => {
        e.preventDefault()
        const p = normalizeBdPhone(phone)
        const next: Record<string, string> = {}
        if (!rating) next.rating = "Please select a star rating"
        if (name.trim().length < 2) next.name = "Please enter your name"
        if (phone && !/^01[3-9]\d{8}$/.test(p))
          next.phone = "Please enter a valid mobile number"
        if (text.trim().length < 10) next.text = "Please write at least 10 characters"
        setErrors(next)
        if (Object.keys(next).length) return
        setSending(true)
        try {
          await shopApi.submitReview(product.slug, {
            name: name.trim(),
            phone: phone ? p : undefined,
            rating,
            text: text.trim(),
          })
        } catch (err) {
          toast.error(getErrorMessage(err))
          return
        } finally {
          setSending(false)
        }
        toast.success("Thank you! Your review will appear once it's approved.")
        setOpen(false)
        setRating(0)
        setName("")
        setPhone("")
        setText("")
      }}
    >
      <p className="font-semibold">Your Review</p>
      <Field data-invalid={Boolean(errors.rating)}>
        <FieldLabel>Rating *</FieldLabel>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star`}
              onClick={() => setRating(n)}
              className="rounded p-0.5"
            >
              <Star
                className={cn(
                  "size-7",
                  n <= rating
                    ? "fill-foreground text-foreground"
                    : "text-muted-foreground/40"
                )}
              />
            </button>
          ))}
        </div>
        <FieldError errors={errors.rating ? [{ message: errors.rating }] : undefined} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor={fid("rname")}>Name *</FieldLabel>
          <Input
            id={fid("rname")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            aria-invalid={Boolean(errors.name)}
          />
          <FieldError errors={errors.name ? [{ message: errors.name }] : undefined} />
        </Field>
        <Field data-invalid={Boolean(errors.phone)}>
          <FieldLabel htmlFor={fid("rphone")}>Mobile (optional)</FieldLabel>
          <Input
            id={fid("rphone")}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Number used for your order — for a Verified badge"
            aria-invalid={Boolean(errors.phone)}
          />
          <FieldError errors={errors.phone ? [{ message: errors.phone }] : undefined} />
        </Field>
      </div>
      <Field data-invalid={Boolean(errors.text)}>
        <FieldLabel htmlFor={fid("rtext")}>Review *</FieldLabel>
        <Textarea
          id={fid("rtext")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={600}
          aria-invalid={Boolean(errors.text)}
        />
        <FieldError errors={errors.text ? [{ message: errors.text }] : undefined} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" disabled={sending}>
          {sending ? "Submitting..." : "Submit"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
