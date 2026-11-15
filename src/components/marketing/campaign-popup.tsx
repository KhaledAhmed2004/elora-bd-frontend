"use client"

import { Check, Copy, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dialog as DialogPrimitive } from "radix-ui"
import { type ComponentType, type ReactNode, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Countdown } from "@/components/home/countdown"
import { analytics } from "@/lib/analytics"
import {
  deviceAllowed,
  frequencyAllows,
  markConverted,
  markShown,
  pageAllowed,
  scheduleState,
  type ShopPopup,
} from "@/lib/popups"
import { shopApi } from "@/lib/shop-api"
import { cn } from "@/lib/utils"
import { useCartStore } from "@/store/cart-store"

/** Fields the card draws; the admin preview passes unsaved form values */
export type PopupContent = Pick<
  ShopPopup,
  | "badge"
  | "title"
  | "subtitle"
  | "image"
  | "cta"
  | "href"
  | "couponCode"
  | "layout"
  | "endsAt"
  | "showCountdown"
>

type TextSlot = ComponentType<{ className?: string; children?: ReactNode }>

interface CardProps {
  popup: PopupContent
  onClose: () => void
  onCta?: () => void
  /** Admin preview: buttons work but never navigate or touch the cart */
  preview?: boolean
  /** Dialog.Title / Dialog.Description when shown inside the real dialog */
  Title?: TextSlot | "h2"
  Description?: TextSlot | "p"
}

const MOBILE_QUERY = "(max-width: 767px)"

/* ───────────────────────── Card (pure UI) ───────────────────────── */

/** Sized by its box (container queries), so the admin preview matches the shop */
export function PopupCard(props: CardProps) {
  return (
    <div className="@container">
      <PopupCardInner {...props} />
    </div>
  )
}

function PopupCardInner({
  popup,
  onClose,
  onCta,
  preview = false,
  Title = "h2",
  Description = "p",
}: CardProps) {
  const { layout, image } = popup

  if (layout === "IMAGE") {
    const hasExtras = !!(popup.cta || popup.couponCode || countdownEnd(popup))
    return (
      <div className="relative overflow-hidden bg-card">
        <CloseButton onClose={onClose} onImage />
        <CtaLink
          popup={popup}
          preview={preview}
          onCta={onCta}
          className="block"
          aria-label={popup.title}
        >
          {image ? (
            <Image
              src={image}
              alt={popup.title}
              width={1200}
              height={800}
              unoptimized
              priority
              className="h-auto max-h-[60dvh] w-full object-contain @2xl:max-h-[70dvh]"
            />
          ) : (
            <div className="grid aspect-[3/2] place-items-center bg-muted text-sm text-muted-foreground">
              Add an image
            </div>
          )}
        </CtaLink>
        {/* Screen readers still get the title; it's in the artwork for everyone else */}
        <Title className="sr-only">{popup.title}</Title>
        {hasExtras && (
          <div className="flex flex-wrap items-center justify-center gap-3 border-t bg-card px-4 py-3">
            <PopupCountdown popup={popup} compact />
            <CouponBox code={popup.couponCode} preview={preview} compact />
            <CtaButton popup={popup} preview={preview} onCta={onCta} compact />
          </div>
        )}
      </div>
    )
  }

  const body = (
    <div
      className={cn(
        "flex flex-col gap-4 px-6 pt-6 pb-5 @2xl:px-8 @2xl:py-9",
        layout === "TEXT" && "items-center text-center"
      )}
    >
      {popup.badge && (
        <span className="w-fit rounded-full border border-gold/60 bg-gold-light/40 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-gold-ink uppercase">
          {popup.badge}
        </span>
      )}
      <Title className="font-display text-3xl leading-[1.1] font-semibold text-balance text-espresso @2xl:text-4xl dark:text-foreground">
        {popup.title || "Your headline"}
      </Title>
      <span aria-hidden className={cn("gold-rule w-24", layout === "SPLIT" && "-mt-1")} />
      {popup.subtitle && (
        <Description className="text-[15px] leading-relaxed text-pretty text-muted-foreground">
          {popup.subtitle}
        </Description>
      )}
      <PopupCountdown popup={popup} />
      <CouponBox code={popup.couponCode} preview={preview} />
      <div
        className={cn("mt-1 flex w-full flex-col gap-1", layout === "TEXT" && "max-w-xs")}
      >
        <CtaButton popup={popup} preview={preview} onCta={onCta} />
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-md text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          No thanks
        </button>
      </div>
    </div>
  )

  if (layout === "TEXT") {
    return (
      <div className="relative overflow-hidden bg-blush-soft">
        {/* Soft brand decoration, purely visual */}
        <Image
          src="/brand/butterfly-emblem.svg"
          alt=""
          aria-hidden
          width={220}
          height={220}
          className="pointer-events-none absolute -top-10 -right-12 opacity-[0.12] select-none"
        />
        <Image
          src="/brand/butterfly-emblem.svg"
          alt=""
          aria-hidden
          width={160}
          height={160}
          className="pointer-events-none absolute -bottom-10 -left-10 rotate-180 opacity-[0.08] select-none"
        />
        <CloseButton onClose={onClose} />
        <div className="relative">{body}</div>
      </div>
    )
  }

  // SPLIT: image on top (mobile) / left (desktop)
  return (
    <div className="relative grid overflow-hidden bg-card @2xl:grid-cols-[1.05fr_1fr]">
      <CloseButton onClose={onClose} onImage />
      <div className="relative aspect-[16/10] bg-blush @2xl:aspect-auto @2xl:min-h-[440px]">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            unoptimized
            priority
            sizes="(min-width: 768px) 400px, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-espresso/60">
            Add an image
          </div>
        )}
      </div>
      {body}
    </div>
  )
}

function countdownEnd(popup: PopupContent) {
  if (!popup.showCountdown || !popup.endsAt) return null
  const t = new Date(popup.endsAt).getTime()
  return Number.isFinite(t) ? Math.floor(t / 1000) : null
}

function PopupCountdown({ popup, compact }: { popup: PopupContent; compact?: boolean }) {
  const end = countdownEnd(popup)
  if (!end) return null
  return (
    <div
      className={cn("flex flex-col gap-1.5", popup.layout === "TEXT" && "items-center")}
    >
      {!compact && (
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Offer ends in
        </span>
      )}
      <Countdown endsAt={end} />
    </div>
  )
}

function CloseButton({ onClose, onImage }: { onClose: () => void; onImage?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className={cn(
        "absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        onImage
          ? "bg-white/90 text-espresso shadow-md backdrop-blur hover:bg-white"
          : "text-espresso/70 hover:bg-espresso/5 hover:text-espresso dark:text-foreground"
      )}
    >
      <X className="size-5" />
    </button>
  )
}

function CouponBox({
  code,
  preview,
  compact,
}: {
  code: string | null
  preview: boolean
  compact?: boolean
}) {
  const setCoupon = useCartStore((s) => s.setCoupon)
  const [copied, setCopied] = useState(false)
  if (!code) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // Clipboard blocked (http, old browser): saving it to the cart still works
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    if (preview) return
    setCoupon(code)
    toast.success(`Code ${code} copied`, {
      description: "It is saved and will apply in your cart automatically.",
    })
  }

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-gold bg-gold-light/25 p-1.5 pl-4",
        compact ? "w-auto" : "max-w-xs"
      )}
    >
      <span className="flex flex-col text-left">
        {!compact && (
          <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
            Use code
          </span>
        )}
        <span className="font-mono text-base font-bold tracking-widest text-espresso dark:text-foreground">
          {code}
        </span>
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-espresso px-3 text-sm font-medium text-white transition hover:bg-cocoa focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? `Code ${code} copied` : ""}
      </span>
    </div>
  )
}

const isExternal = (href: string) => /^https?:\/\//.test(href)

function CtaLink({
  popup,
  preview,
  onCta,
  className,
  children,
  "aria-label": ariaLabel,
}: {
  popup: PopupContent
  preview: boolean
  onCta?: () => void
  className?: string
  children: ReactNode
  "aria-label"?: string
}) {
  const { href } = popup
  if (!href) return <div className={className}>{children}</div>
  const onClick = (e: React.MouseEvent) => {
    if (preview) e.preventDefault()
    onCta?.()
  }
  return isExternal(href) ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </a>
  ) : (
    <Link href={href} className={className} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </Link>
  )
}

function CtaButton({
  popup,
  preview,
  onCta,
  compact,
}: {
  popup: PopupContent
  preview: boolean
  onCta?: () => void
  compact?: boolean
}) {
  if (!popup.cta || !popup.href) return null
  return (
    <CtaLink
      popup={popup}
      preview={preview}
      onCta={onCta}
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-md bg-espresso px-6 text-sm font-semibold tracking-[0.12em] text-white uppercase shadow-sm transition hover:bg-cocoa focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98]",
        compact ? "min-h-11" : "w-full"
      )}
    >
      {popup.cta}
    </CtaLink>
  )
}

/* ───────────────────────── Dialog shell ───────────────────────── */

export function PopupDialog({
  popup,
  open,
  onOpenChange,
  onCta,
  preview,
}: {
  popup: PopupContent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCta?: () => void
  preview?: boolean
}) {
  return (
    <DialogPrimitive.Root open={open && !!popup} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-espresso/55 backdrop-blur-[3px] motion-reduce:animate-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        {popup && (
          <DialogPrimitive.Content
            // No subtitle → no Description; tell Radix that's intended
            {...(!(popup.subtitle && popup.layout !== "IMAGE") && {
              "aria-describedby": undefined,
            })}
            className={cn(
              "fixed z-[60] w-full overflow-y-auto overscroll-contain bg-card shadow-2xl outline-none",
              // Mobile: bottom sheet
              "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl pb-[env(safe-area-inset-bottom)]",
              "max-md:data-open:animate-in max-md:data-open:slide-in-from-bottom max-md:data-closed:animate-out max-md:data-closed:slide-out-to-bottom",
              // Desktop: centred modal
              "md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:max-h-[90dvh] md:w-[calc(100%-3rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl",
              "md:data-open:animate-in md:data-open:fade-in-0 md:data-open:zoom-in-95 md:data-closed:animate-out md:data-closed:fade-out-0 md:data-closed:zoom-out-95",
              "duration-300 motion-reduce:animate-none",
              popup.layout === "TEXT" ? "md:max-w-md" : "md:max-w-3xl"
            )}
          >
            {/* Grab handle, a familiar bottom-sheet cue */}
            <span
              aria-hidden
              className="absolute top-2 left-1/2 z-10 h-1 w-10 -translate-x-1/2 rounded-full bg-espresso/20 md:hidden"
            />
            <PopupCard
              popup={popup}
              preview={preview}
              onClose={() => onOpenChange(false)}
              onCta={onCta}
              Title={DialogPrimitive.Title}
              Description={DialogPrimitive.Description}
            />
          </DialogPrimitive.Content>
        )}
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/* ───────────────────────── Storefront manager ───────────────────────── */

/**
 * Picks the first campaign that fits this page, device, schedule and the
 * visitor's history, waits for its trigger, then shows it once.
 * Lives in the shop layout, so it survives client-side navigation.
 */
export function CampaignPopupManager({ popups }: { popups: ShopPopup[] }) {
  const pathname = usePathname()
  const [current, setCurrent] = useState<ShopPopup | null>(null)
  const [open, setOpen] = useState(false)
  const openRef = useRef(false)

  useEffect(() => {
    if (!popups.length || openRef.current) return
    const isMobile = window.matchMedia(MOBILE_QUERY).matches
    const now = Date.now()
    const candidate = popups.find(
      (p) =>
        scheduleState(p, now) === "running" &&
        pageAllowed(p.pages, pathname) &&
        deviceAllowed(p.device, isMobile) &&
        frequencyAllows(p)
    )
    if (!candidate) return

    const show = () => {
      if (openRef.current) return
      openRef.current = true
      markShown(candidate.id)
      shopApi.popupEvent(candidate.id, "view")
      analytics.promotionView(candidate.id, candidate.title)
      setCurrent(candidate)
      setOpen(true)
    }
    return armTrigger(candidate, isMobile, show)
  }, [pathname, popups])

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) openRef.current = false
  }

  const onCta = () => {
    if (!current) return
    shopApi.popupEvent(current.id, "click")
    analytics.promotionClick(current.id, current.title)
    markConverted(current.id)
    onOpenChange(false)
  }

  return (
    <PopupDialog popup={current} open={open} onOpenChange={onOpenChange} onCta={onCta} />
  )
}

/**
 * Calls `fire` when the campaign's trigger happens. Never interrupts another
 * open dialog (cart drawer, menu): it waits and tries again.
 * Returns a cleanup function.
 */
function armTrigger(p: ShopPopup, isMobile: boolean, fire: () => void) {
  const timers: ReturnType<typeof setTimeout>[] = []
  const cleanups: (() => void)[] = []
  let done = false

  const tryFire = () => {
    if (done) return
    if (document.querySelector('[role="dialog"], [role="alertdialog"]')) {
      timers.push(setTimeout(tryFire, 4000))
      return
    }
    done = true
    fire()
  }
  const after = (ms: number) => timers.push(setTimeout(tryFire, ms))

  switch (p.trigger) {
    case "ON_LOAD":
      // A short beat so the page paints first (keeps LCP clean)
      after(800)
      break
    case "DELAY":
      after(Math.max(1, p.delaySeconds) * 1000)
      break
    case "SCROLL": {
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        if (max > 0 && (window.scrollY / max) * 100 >= p.scrollPercent) tryFire()
      }
      window.addEventListener("scroll", onScroll, { passive: true })
      cleanups.push(() => window.removeEventListener("scroll", onScroll))
      // Short pages can't be scrolled that far
      if (document.documentElement.scrollHeight <= window.innerHeight * 1.2) after(10_000)
      break
    }
    case "EXIT_INTENT": {
      if (isMobile) {
        // Phones have no "mouse leaving" signal: show after a while instead
        after(20_000)
        break
      }
      const armedAt = Date.now() + 3000
      const onOut = (e: MouseEvent) => {
        if (!e.relatedTarget && e.clientY <= 0 && Date.now() > armedAt) tryFire()
      }
      document.addEventListener("mouseout", onOut)
      cleanups.push(() => document.removeEventListener("mouseout", onOut))
      break
    }
  }

  return () => {
    done = true
    timers.forEach(clearTimeout)
    cleanups.forEach((c) => c())
  }
}
