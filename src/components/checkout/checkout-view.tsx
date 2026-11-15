"use client"

import { useFieldId } from "@/hooks/use-field-id"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Banknote,
  CreditCard,
  Loader2,
  Lock,
  ShoppingBag,
  Smartphone,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { CouponForm } from "@/components/cart/coupon-form"
import { LocationFields } from "@/components/shared/location-fields"
import { OrderTotals } from "@/components/cart/order-totals"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useHydrated } from "@/hooks/use-hydrated"
import { useQueryClient } from "@tanstack/react-query"

import { ItemProblem } from "@/components/cart/cart-view"
import { analytics } from "@/lib/analytics"
import { getErrorMessage, isApiStatus } from "@/lib/api"
import { formatPrice, normalizeBdPhone } from "@/lib/format"
import { variantLabel } from "@/lib/variants"
import { useCartQuote } from "@/lib/pricing"
import { shopApi } from "@/lib/shop-api"
import { cn } from "@/lib/utils"
import { checkoutSchema } from "@/lib/validations/checkout"
import { useAuthStore } from "@/store/auth-store"
import { useCartStore } from "@/store/cart-store"
import { useRecentOrdersStore } from "@/store/recent-orders-store"
import { useSiteSettings } from "@/providers/site-settings"
import type { PaymentMethod } from "@/types"

const PAYMENT_OPTIONS: {
  value: PaymentMethod
  label: string
  text: string
  icon: typeof Banknote
}[] = [
  {
    value: "cod",
    label: "Cash on Delivery",
    text: "Pay when you receive your order",
    icon: Banknote,
  },
  { value: "bkash", label: "bKash", text: "Pay in advance with bKash", icon: Smartphone },
  { value: "nagad", label: "Nagad", text: "Pay in advance with Nagad", icon: Smartphone },
  {
    value: "sslcommerz",
    label: "Card / Online Banking",
    text: "Visa, Mastercard, Rocket, internet banking",
    icon: CreditCard,
  },
]

export function CheckoutView() {
  const hydrated = useHydrated()
  const items = useCartStore((s) => s.items)
  // After placing, the cart is cleared — keep showing a loader until we navigate away
  const [placed, setPlaced] = useState(false)
  // Next keeps visited routes mounted but hidden (<Activity>). Reset the
  // "placed" loader when this page is hidden so a later visit isn't stuck on it.
  useLayoutEffect(() => () => setPlaced(false), [])

  if (placed) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary" />
        Confirming your order...
      </div>
    )
  }

  if (!hydrated) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <Skeleton className="h-[600px] rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-20 text-center">
        <ShoppingBag className="size-12 text-muted-foreground" />
        <div>
          <p className="text-lg font-semibold">Nothing to check out</p>
          <p className="text-sm text-muted-foreground">Add some products to your cart first</p>
        </div>
        <Button asChild size="lg">
          <Link href="/products">Start Shopping</Link>
        </Button>
      </div>
    )
  }

  return <CheckoutForm onPlaced={() => setPlaced(true)} />
}

function CheckoutForm({ onPlaced }: { onPlaced: () => void }) {
  const fid = useFieldId()
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const couponCode = useCartStore((s) => s.couponCode)
  const clearCart = useCartStore((s) => s.clearCart)
  const queryClient = useQueryClient()

  // Logged-in customers get their name, phone and default address pre-filled
  const user = useAuthStore((s) => s.user)
  const saved = useAuthStore((s) => s.addresses.find((a) => a.isDefault))

  const settings = useSiteSettings()
  const addRecentOrder = useRecentOrdersStore((s) => s.add)
  const paymentOptions = PAYMENT_OPTIONS.filter((o) => settings.payments[o.value])

  const form = useForm({
    resolver: zodResolver(checkoutSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: saved?.fullName ?? user?.name ?? "",
      phone: saved?.phone ?? user?.phone ?? "",
      email: user?.email ?? "",
      division: saved?.division ?? "",
      district: saved?.district ?? "",
      upazila: saved?.upazila ?? "",
      address: saved?.address ?? "",
      paymentMethod: paymentOptions[0]?.value ?? "cod",
      note: "",
      advanceMethod: "bkash",
      advanceSender: "",
      advanceTrxId: "",
    },
  })

  const [
    division,
    district,
    upazila,
    paymentMethod,
    advanceMethod,
    fullName,
    phone,
    address,
  ] = useWatch({
    control: form.control,
    name: [
      "division",
      "district",
      "upazila",
      "paymentMethod",
      "advanceMethod",
      "fullName",
      "phone",
      "address",
    ],
  })
  // Priced by the server: live prices, stock, coupon, delivery and advance rule
  const totals = useCartQuote({ district: district || undefined, paymentMethod })

  // Shop may ask COD customers to pay the delivery charge in advance (fake-order guard)
  const advanceAmount = totals.advanceAmount
  const advanceRequired = advanceAmount > 0
  const sendTo =
    advanceMethod === "nagad"
      ? settings.advance.nagadNumber
      : settings.advance.bkashNumber

  // Incomplete-order capture: once a valid number is typed, save phone + cart so
  // the shop can call customers who leave without ordering (debounced). Placing the
  // order resolves the lead, and clearing the cart cancels any pending save.
  const leadPhone = normalizeBdPhone(phone ?? "")
  useEffect(() => {
    if (!/^01[3-9]\d{8}$/.test(leadPhone) || items.length === 0) return
    const t = setTimeout(() => {
      // Best effort: a failed save must never bother the customer
      shopApi
        .lead({
          phone: leadPhone,
          fullName: (fullName ?? "").trim() || undefined,
          division: division || undefined,
          district: district || undefined,
          upazila: upazila || undefined,
          address: (address ?? "").trim() || undefined,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId ?? null,
            quantity: i.quantity,
          })),
        })
        .catch(() => {})
    }, 1500)
    return () => clearTimeout(t)
  }, [leadPhone, fullName, division, district, upazila, address, items])

  // Fire InitiateCheckout once per visit
  const tracked = useRef(false)
  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    analytics.initiateCheckout(
      items.map((i) => ({
        id: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      }))
    )
  }, [items])

  const onSubmit = form.handleSubmit(async (values) => {
    if (totals.problems.length) {
      toast.error(totals.problems[0].message)
      return
    }
    if (advanceRequired && !values.advanceTrxId) {
      form.setError("advanceTrxId", { message: "Enter the Transaction ID" })
      return
    }
    try {
      const order = await shopApi.placeOrder({
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId ?? null,
          quantity: i.quantity,
        })),
        couponCode,
        shippingAddress: {
          fullName: values.fullName,
          phone: values.phone,
          division: values.division,
          district: values.district,
          upazila: values.upazila,
          address: values.address,
        },
        email: values.email || undefined,
        paymentMethod: values.paymentMethod,
        note: values.note || undefined,
        advance: advanceRequired
          ? {
              method: values.advanceMethod ?? "bkash",
              trxId: values.advanceTrxId!.trim(),
              senderNumber: values.advanceSender || undefined,
            }
          : null,
      })
      addRecentOrder(order)
      analytics.purchase(
        order.orderNumber,
        order.items.map((i) => ({
          id: i.productId ?? i.name,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        order.total
      )
      onPlaced()
      router.replace(`/order-success?order=${order.orderNumber}`)
      clearCart()
    } catch (e) {
      // Prices/stock may have changed meanwhile: re-quote so the page shows why
      void queryClient.invalidateQueries({ queryKey: ["quote"] })
      toast.error(
        isApiStatus(e, 403) || isApiStatus(e, 409) || isApiStatus(e, 400)
          ? getErrorMessage(e)
          : "We couldn't place your order. Please try again or give us a call."
      )
    }
  })

  const submitting = form.formState.isSubmitting

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px]">
      <form id="checkout-form" onSubmit={onSubmit} noValidate className="space-y-6">
        {/* 1. Delivery information */}
        <section className="rounded-2xl border p-5 md:p-6">
          <h2 className="mb-5 flex items-center gap-2 font-semibold">
            <StepBadge n={1} /> Delivery Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={form.control}
              name="fullName"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={fid("fullName")}>Your Name *</FieldLabel>
                  <Input
                    {...field}
                    id={fid("fullName")}
                    autoComplete="name"
                    placeholder="Full name"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="phone"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={fid("phone")}>Mobile Number *</FieldLabel>
                  <Input
                    {...field}
                    id={fid("phone")}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="01XXXXXXXXX"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <LocationFields
              className="sm:col-span-2"
              values={{ division, district, upazila }}
              errors={{
                division: form.formState.errors.division?.message,
                district: form.formState.errors.district?.message,
                upazila: form.formState.errors.upazila?.message,
              }}
              onChange={(key, value) =>
                form.setValue(key, value, {
                  shouldValidate: value !== "",
                  shouldTouch: true,
                })
              }
              onBlur={(key) => form.trigger(key)}
            />

            <Controller
              control={form.control}
              name="address"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                  <FieldLabel htmlFor={fid("address")}>Full Address *</FieldLabel>
                  <Textarea
                    {...field}
                    id={fid("address")}
                    rows={2}
                    autoComplete="street-address"
                    placeholder="House no., road, area, landmark (e.g. House 12, Road 5, Mirpur 10, near the mosque)"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={fid("email")}>
                    Email{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={fid("email")}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="note"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={fid("note")}>
                    Order Note{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={fid("note")}
                    placeholder="E.g. Please deliver after 5 PM"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </div>
        </section>

        {/* 2. Payment */}
        <section className="rounded-2xl border p-5 md:p-6">
          <h2 className="mb-5 flex items-center gap-2 font-semibold">
            <StepBadge n={2} /> Payment Method
          </h2>
          <Controller
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <div
                role="radiogroup"
                aria-label="Payment method"
                className="grid gap-3 sm:grid-cols-2"
              >
                {paymentOptions.map(({ value, label, text, icon: Icon }) => {
                  const active = field.value === value
                  return (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors hover:border-primary/60",
                        active && "border-primary bg-accent/50 ring-1 ring-primary"
                      )}
                    >
                      <input
                        type="radio"
                        name={field.name}
                        value={value}
                        checked={active}
                        onChange={() => field.onChange(value)}
                        className="mt-1 accent-(--primary)"
                      />
                      <span className="flex-1">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          <Icon className="size-4 text-primary" /> {label}
                        </span>
                        <span className="text-xs text-muted-foreground">{text}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          />
          {advanceRequired && (
            <div className="mt-4 space-y-4 rounded-xl border-2 border-dashed border-primary/40 bg-accent/40 p-4">
              <div className="text-sm">
                <p className="font-semibold">
                  Pay the {formatPrice(advanceAmount)} delivery charge in advance
                </p>
                <p className="mt-1 text-muted-foreground">
                  <strong>Send Money</strong> to the number below and enter the Transaction ID.
                  Pay the rest when you receive your order.
                </p>
              </div>
              <div className="flex gap-2">
                {(["bkash", "nagad"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={advanceMethod === m}
                    onClick={() => form.setValue("advanceMethod", m)}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm font-medium",
                      advanceMethod === m &&
                        "border-primary bg-primary text-primary-foreground"
                    )}
                  >
                    {m === "bkash" ? "bKash" : "Nagad"}
                  </button>
                ))}
              </div>
              <p className="rounded-lg bg-background px-3 py-2 text-sm">
                {advanceMethod === "nagad" ? "Nagad" : "bKash"} (Personal):{" "}
                <strong className="font-mono text-base tracking-wide">{sendTo}</strong>
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={form.control}
                  name="advanceSender"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor={fid("advanceSender")}>
                        Number You Sent From
                      </FieldLabel>
                      <Input
                        {...field}
                        id={fid("advanceSender")}
                        type="tel"
                        inputMode="numeric"
                        placeholder="01XXXXXXXXX"
                      />
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="advanceTrxId"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={fid("advanceTrxId")}>
                        Transaction ID *
                      </FieldLabel>
                      <Input
                        {...field}
                        id={fid("advanceTrxId")}
                        placeholder="E.g. 8N7A6B5C4D"
                        className="font-mono uppercase placeholder:font-sans placeholder:normal-case"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </div>
            </div>
          )}
          {paymentMethod !== "cod" && (
            <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              You&apos;ll be taken to the payment page after confirming your order. (Online
              payment goes live once the backend is connected — for now the order is
              placed as &ldquo;unpaid&rdquo;.)
            </p>
          )}
        </section>
      </form>

      {/* Summary (outside the form: CouponForm is its own <form>) */}
      <aside className="space-y-4 lg:sticky lg:top-32">
        <div className="space-y-4 rounded-2xl border p-5">
          <h2 className="font-semibold">Your Order ({items.length})</h2>
          <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
            {items.map((item) => (
              <li key={item.key} className="flex gap-3">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                  <span className="absolute top-0 right-0 flex size-5 items-center justify-center rounded-bl-md bg-foreground text-[10px] font-bold text-background">
                    {item.quantity}
                  </span>
                </span>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="line-clamp-1 font-medium">{item.name}</p>
                  <ItemProblem totals={totals} item={item} />
                  {item.attributes && (
                    <p className="text-xs text-muted-foreground">
                      {variantLabel(item.attributes)}
                    </p>
                  )}
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <CouponForm
            subtotal={totals.subtotal}
            applied={totals.coupon}
            staleError={totals.couponError}
          />
          <OrderTotals totals={totals} />
          {advanceRequired && (
            <dl className="space-y-1 rounded-lg bg-accent/50 p-3 text-sm">
              <div className="flex justify-between">
                <dt>Advance now</dt>
                <dd className="font-semibold tabular-nums">
                  {formatPrice(advanceAmount)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Pay on delivery</dt>
                <dd className="font-semibold tabular-nums">
                  {formatPrice(totals.total - advanceAmount)}
                </dd>
              </div>
            </dl>
          )}
          {district && (
            <p className="text-xs text-muted-foreground">
              {district === "Dhaka"
                ? "Delivery inside Dhaka: 1-2 days"
                : "Delivery outside Dhaka: 3-5 days"}
            </p>
          )}
          <Button
            type="submit"
            form="checkout-form"
            size="lg"
            className="h-12 w-full text-base"
            disabled={submitting || totals.problems.length > 0}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" /> Placing order...
              </>
            ) : (
              <>
                <Lock /> Place Order · {formatPrice(totals.total)}
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            By placing an order, you agree to our{" "}
            <Link href="/terms" className="underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/return-policy" className="underline">
              Return Policy
            </Link>
            .
          </p>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Need help? Call us at{" "}
          <a href={`tel:${settings.phone}`} className="font-medium text-primary">
            {settings.phone}
          </a>
        </p>
      </aside>
    </div>
  )
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
      {n}
    </span>
  )
}
