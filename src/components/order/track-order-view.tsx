"use client"

import { useFieldId } from "@/hooks/use-field-id"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Loader2, PackageSearch, XCircle } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

import { getErrorMessage } from "@/lib/api"
import { formatDate, formatPrice } from "@/lib/format"
import { ORDER_STEPS, trackOrder } from "@/lib/orders"
import { cn } from "@/lib/utils"
import { trackOrderSchema } from "@/lib/validations/order"
import type { Order } from "@/types"

/** Uses useSearchParams → render inside <Suspense>. */
export function TrackOrderView() {
  const fid = useFieldId()
  const prefill = useSearchParams().get("order") ?? ""
  const [result, setResult] = useState<Order | null | undefined>(undefined)

  const form = useForm({
    resolver: zodResolver(trackOrderSchema),
    defaultValues: { orderNumber: prefill, phone: "" },
  })

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      setResult(await trackOrder(v.orderNumber, v.phone))
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  })

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <form
        onSubmit={onSubmit}
        noValidate
        className="space-y-4 rounded-2xl border p-5 md:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="orderNumber"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={fid("orderNumber")}>Order Number</FieldLabel>
                <Input
                  {...field}
                  id={fid("orderNumber")}
                  placeholder="BD-123456"
                  className="uppercase placeholder:normal-case"
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
                <FieldLabel htmlFor={fid("phone")}>
                  Mobile Number Used for Order
                </FieldLabel>
                <Input
                  {...field}
                  id={fid("phone")}
                  type="tel"
                  inputMode="numeric"
                  placeholder="01XXXXXXXXX"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <PackageSearch />
          )}
          Track Order
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Demo: try <strong>BD-100245</strong> with <strong>01712345678</strong>
        </p>
      </form>

      {result === null && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <XCircle className="size-5 shrink-0 text-destructive" />
          No order found with this order number and mobile number. Please check both and
          try again.
        </div>
      )}

      {result && <OrderStatus order={result} />}
    </div>
  )
}

function OrderStatus({ order }: { order: Order }) {
  const cancelled = order.status === "cancelled" || order.status === "returned"
  const currentIndex = ORDER_STEPS.findIndex((s) => s.status === order.status)

  return (
    <section className="rounded-2xl border p-5 md:p-6" aria-live="polite">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">Order No</p>
          <p className="text-lg font-bold">{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-lg font-bold">{formatPrice(order.total)}</p>
          <p className="text-xs text-muted-foreground">
            {order.items.length} {order.items.length === 1 ? "product" : "products"}
          </p>
        </div>
      </div>

      {cancelled ? (
        <p className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive">
          This order has been {order.status === "cancelled" ? "cancelled" : "returned"}.
        </p>
      ) : (
        <ol className="relative space-y-6">
          {ORDER_STEPS.map((step, i) => {
            const done = i <= currentIndex
            const current = i === currentIndex
            return (
              <li key={step.status} className="relative flex gap-4">
                {i < ORDER_STEPS.length - 1 && (
                  <span
                    className={cn(
                      "absolute top-8 left-[15px] h-[calc(100%-8px)] w-0.5",
                      i < currentIndex ? "bg-primary" : "bg-border"
                    )}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2",
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground",
                    current && "ring-4 ring-primary/20"
                  )}
                >
                  {done ? (
                    <Check className="size-4" />
                  ) : (
                    <span className="text-xs">{i + 1}</span>
                  )}
                </span>
                <div className="pt-1">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      !done && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.text}</p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
