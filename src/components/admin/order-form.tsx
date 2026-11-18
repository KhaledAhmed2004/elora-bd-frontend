"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, Plus, Trash2, UserCheck } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"

import { LocationFields } from "@/components/shared/location-fields"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useFieldId } from "@/hooks/use-field-id"
import { SOURCE_LABEL } from "@/lib/admin/constants"
import {
  adminActions,
  type AdminOrder,
  type AdminOrderInput,
  adminQueries,
  useAdminMutation,
  useAdminQuery,
} from "@/lib/admin/queries"
import { formatPrice } from "@/lib/format"
import { deliveryChargeFor } from "@/lib/pricing"
import { adminOrderSchema, type AdminOrderValues } from "@/lib/validations/admin-order"

import { RiskBadge } from "./risk-badge"

export { SOURCE_LABEL }

type Order = AdminOrder

const variantName = (v: { color: string | null; size: string | null }) =>
  [v.color, v.size].filter(Boolean).join(" / ")

const num = (value: number | undefined, onChange: (v: number | undefined) => void) => ({
  type: "number" as const,
  inputMode: "numeric" as const,
  min: 0,
  value: value ?? "",
  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange(e.target.value === "" ? undefined : Number(e.target.value)),
})

function defaults(
  order?: Pick<
    Order,
    | "shippingAddress"
    | "items"
    | "deliveryCharge"
    | "discount"
    | "paymentMethod"
    | "note"
    | "adminNote"
    | "advance"
  > & { source?: Order["source"] }
) {
  const a = order?.shippingAddress
  return {
    source: order?.source ?? ("facebook" as const),
    phone: a?.phone ?? "",
    fullName: a?.fullName ?? "",
    division: a?.division ?? "",
    district: a?.district ?? "",
    upazila: a?.upazila ?? "",
    address: a?.address ?? "",
    items:
      order?.items.map((i) => ({
        productId: i.productId ?? "",
        variantId: i.variantId ?? null,
        name: i.name,
        image: i.image,
        price: i.price,
        quantity: i.quantity,
      })) ?? [],
    deliveryCharge: order?.deliveryCharge ?? 0,
    discount: order?.discount ?? 0,
    paymentMethod: order?.paymentMethod ?? ("cod" as const),
    status: "confirmed" as const,
    note: order?.note ?? "",
    adminNote: order?.adminNote ?? "",
    advanceAmount: order?.advance?.amount,
    advanceMethod: order?.advance?.method ?? ("bkash" as const),
    advanceTrxId: order?.advance?.trxId ?? "",
  }
}

export function OrderForm({
  order,
  draft,
  leadId,
  onCreated,
}: {
  order?: Order
  /** Prefill for a NEW order (e.g. from an incomplete checkout) */
  draft?: Parameters<typeof defaults>[0]
  /** Incomplete checkout this order recovers */
  leadId?: string
  onCreated?: (order: Order) => void
}) {
  const router = useRouter()
  const fid = useFieldId()
  const { data: productPage } = useAdminQuery(["products", "picker"], () =>
    adminQueries.products({ limit: 500 })
  )
  const products = productPage?.data ?? []
  const { data: settings } = useAdminQuery(["settings"], adminQueries.settings)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [chargeEdited, setChargeEdited] = useState(Boolean(order))

  const form = useForm({
    resolver: zodResolver(adminOrderSchema),
    mode: "onTouched",
    defaultValues: defaults(order ?? draft),
  })
  const items = useFieldArray({ control: form.control, name: "items" })
  const v = useWatch({ control: form.control })
  const err = form.formState.errors

  const subtotal = (v.items ?? []).reduce(
    (s, i) => s + (i.price ?? 0) * (i.quantity ?? 0),
    0
  )
  const total = Math.max(0, subtotal - (v.discount ?? 0) + (v.deliveryCharge ?? 0))
  const due = v.paymentMethod === "cod" ? Math.max(0, total - (v.advanceAmount ?? 0)) : 0

  // Returning customer lookup + risk (only for valid BD numbers)
  const phone = (v.phone ?? "").replace(/[\s-]/g, "").replace(/^\+?880/, "0")
  const validPhone = /^01[3-9]\d{8}$/.test(phone)
  const { data: history } = useAdminQuery(
    ["orders", "by-phone", phone],
    () => adminQueries.orders({ phone, limit: 5 }),
    { enabled: validPhone }
  )
  const previous = history?.data.find((o) => o.id !== order?.id)
  const risk = validPhone ? (history?.data[0]?.risk ?? null) : null

  function autoCharge(district: string, sub = subtotal) {
    if (!chargeEdited && district && settings)
      form.setValue("deliveryCharge", deliveryChargeFor(settings.delivery, district, sub))
  }

  const save = useAdminMutation(
    (body: AdminOrderInput) =>
      order ? adminActions.editOrder(order.id, body) : adminActions.createOrder(body),
    {
      invalidate: [["orders"], ["dashboard"], ["incomplete"], ["customers"]],
      success: (o) => (order ? "Order updated" : `Order ${o.orderNumber} created`),
      onSuccess: (o) => {
        if (!order) {
          onCreated?.(o)
          form.reset(defaults())
        }
        router.push(`/admin/orders/${o.id}`)
      },
    }
  )

  function addProduct(productId: string) {
    const p = products.find((x) => x.id === productId)
    if (!p) return
    items.append({
      productId: p.id,
      variantId: null,
      name: p.name,
      image: p.images[0]?.url ?? "/placeholder.svg",
      price: p.price,
      quantity: 1,
    })
    setPickerOpen(false)
    if (v.district) autoCharge(v.district, subtotal + p.price)
  }

  const onSubmit = form.handleSubmit((values: AdminOrderValues) => {
    // Products with sizes need one picked
    let missing = false
    values.items.forEach((it, i) => {
      const p = products.find((x) => x.id === it.productId)
      if (p?.variants?.length && !it.variantId) {
        form.setError(`items.${i}.variantId`, { message: "Select a variant" })
        missing = true
      }
    })
    if (missing) return

    const lineItems = values.items.map((it) => ({
      productId: it.productId,
      variantId: it.variantId,
      quantity: it.quantity,
      price: it.price,
    }))
    const shippingAddress = {
      fullName: values.fullName,
      phone: values.phone,
      division: values.division,
      district: values.district,
      upazila: values.upazila,
      address: values.address,
    }
    const advance =
      values.advanceAmount && values.advanceAmount > 0
        ? {
            amount: values.advanceAmount,
            method: values.advanceMethod,
            trxId: values.advanceTrxId ?? "",
          }
        : null
    save.mutate({
      source: values.source,
      items: lineItems,
      shippingAddress,
      paymentMethod: values.paymentMethod,
      deliveryCharge: values.deliveryCharge,
      discount: values.discount,
      note: values.note || null,
      adminNote: values.adminNote || null,
      advance,
      status: values.status,
      leadId: leadId ?? null,
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        {/* Customer */}
        <Card title="Customer">
          <div className="grid gap-4 sm:grid-cols-2">
            {!order && (
              <Controller
                control={form.control}
                name="source"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={fid("source")}>Order source</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id={fid("source")} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SOURCE_LABEL)
                          .filter(([k]) => k !== "website")
                          .map(([k, label]) => (
                            <SelectItem key={k} value={k}>
                              {label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            )}
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
                    placeholder="01XXXXXXXXX"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </div>

          {risk && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
              <RiskBadge risk={risk} />
              <span className="text-muted-foreground">
                {risk.own.total} orders in this shop · {risk.own.delivered} delivered ·{" "}
                {risk.own.returned} returned
              </span>
              {previous && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  onClick={() => {
                    const a = previous.shippingAddress
                    const opts = { shouldValidate: true, shouldDirty: true }
                    form.setValue("fullName", a.fullName, opts)
                    form.setValue("division", a.division, opts)
                    form.setValue("district", a.district, opts)
                    form.setValue("upazila", a.upazila, opts)
                    form.setValue("address", a.address, opts)
                    autoCharge(a.district)
                  }}
                >
                  <UserCheck /> Use previous address
                </Button>
              )}
              {risk.level === "blacklisted" && (
                <p className="w-full text-xs text-destructive">
                  Blacklist reason: {risk.blacklistReason}
                </p>
              )}
            </div>
          )}

          <Controller
            control={form.control}
            name="fullName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={fid("fullName")}>Name *</FieldLabel>
                <Input
                  {...field}
                  id={fid("fullName")}
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <LocationFields
            values={{
              division: v.division ?? "",
              district: v.district ?? "",
              upazila: v.upazila ?? "",
            }}
            errors={{
              division: err.division?.message,
              district: err.district?.message,
              upazila: err.upazila?.message,
            }}
            onChange={(key, value) => {
              form.setValue(key, value, {
                shouldValidate: value !== "",
                shouldTouch: true,
              })
              if (key === "district") autoCharge(value)
            }}
            onBlur={(key) => form.trigger(key)}
          />
          <Controller
            control={form.control}
            name="address"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={fid("address")}>Full address *</FieldLabel>
                <Textarea
                  {...field}
                  id={fid("address")}
                  rows={2}
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </Card>

        {/* Products */}
        <Card title="Products">
          {items.fields.length > 0 && (
            <ul className="divide-y rounded-lg border">
              {items.fields.map((f, i) => {
                const p = products.find((x) => x.id === f.productId)
                const line = v.items?.[i]
                const variant = p?.variants?.find((x) => x.id === line?.variantId)
                const stock = variant
                  ? variant.stock
                  : p?.variants?.length
                    ? undefined
                    : p?.stock
                const over = stock !== undefined && (line?.quantity ?? 0) > stock
                return (
                  <li key={f.id} className="flex flex-wrap items-center gap-3 p-3">
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={f.image}
                        alt=""
                        fill
                        sizes="48px"
                        unoptimized
                        className="object-cover"
                      />
                    </span>
                    <div className="min-w-40 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">{f.name}</p>
                      {stock !== undefined && (
                        <p
                          className={
                            over
                              ? "flex items-center gap-1 text-xs text-amber-700"
                              : "text-xs text-muted-foreground"
                          }
                        >
                          {over && <AlertTriangle className="size-3" />}
                          Stock: {stock}
                        </p>
                      )}
                    </div>
                    {p?.variants?.length ? (
                      <Controller
                        control={form.control}
                        name={`items.${i}.variantId`}
                        render={({ field, fieldState }) => (
                          <div>
                            <Select
                              value={field.value ?? ""}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                className="w-36"
                                aria-label={`${f.name} variant`}
                                aria-invalid={fieldState.invalid}
                              >
                                <SelectValue placeholder="Variant" />
                              </SelectTrigger>
                              <SelectContent>
                                {p.variants.map((vr) => (
                                  <SelectItem key={vr.id} value={vr.id}>
                                    {variantName(vr)} ({vr.stock})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldState.error && (
                              <p className="mt-1 text-xs text-destructive">
                                {fieldState.error.message}
                              </p>
                            )}
                          </div>
                        )}
                      />
                    ) : null}
                    <Controller
                      control={form.control}
                      name={`items.${i}.price`}
                      render={({ field, fieldState }) => (
                        <Input
                          {...num(field.value, field.onChange)}
                          className="w-24"
                          aria-label={`${f.name} price`}
                          aria-invalid={fieldState.invalid}
                        />
                      )}
                    />
                    <span className="text-muted-foreground">×</span>
                    <Controller
                      control={form.control}
                      name={`items.${i}.quantity`}
                      render={({ field, fieldState }) => (
                        <Input
                          {...num(field.value, field.onChange)}
                          min={1}
                          className="w-16"
                          aria-label={`${f.name} quantity`}
                          aria-invalid={fieldState.invalid}
                        />
                      )}
                    />
                    <span className="w-20 text-right text-sm font-semibold tabular-nums">
                      {formatPrice((line?.price ?? 0) * (line?.quantity ?? 0))}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${f.name}`}
                      onClick={() => items.remove(i)}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
          {err.items?.root?.message || err.items?.message ? (
            <p className="text-sm text-destructive">
              {err.items?.root?.message ?? err.items?.message}
            </p>
          ) : null}

          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline">
                <Plus /> Add product
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search products..." />
                <CommandList>
                  <CommandEmpty>No products found</CommandEmpty>
                  {products.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={`${p.name} ${p.id}`}
                      onSelect={() => addProduct(p.id)}
                      disabled={p.stock <= 0}
                    >
                      <span className="line-clamp-1 flex-1">{p.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.stock <= 0 ? "Out of stock" : formatPrice(p.price)}
                      </span>
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </Card>

        <Card title="Notes">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={fid("note")}>Customer note</FieldLabel>
              <Textarea id={fid("note")} rows={2} {...form.register("note")} />
            </Field>
            <Field>
              <FieldLabel htmlFor={fid("adminNote")}>
                Internal note (admin only)
              </FieldLabel>
              <Textarea id={fid("adminNote")} rows={2} {...form.register("adminNote")} />
            </Field>
          </div>
        </Card>
      </div>

      {/* Summary */}
      <div className="space-y-6">
        <Card title="Payment">
          <Controller
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={fid("paymentMethod")}>Payment Method</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={fid("paymentMethod")} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cod">Cash on Delivery</SelectItem>
                    <SelectItem value="bkash">bKash (paid in full)</SelectItem>
                    <SelectItem value="nagad">Nagad (paid in full)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <div className="grid grid-cols-2 gap-3">
            <Controller
              control={form.control}
              name="deliveryCharge"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={fid("deliveryCharge")}>Delivery (৳)</FieldLabel>
                  <Input
                    id={fid("deliveryCharge")}
                    {...num(field.value, (x) => {
                      setChargeEdited(true)
                      field.onChange(x)
                    })}
                    aria-invalid={fieldState.invalid}
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="discount"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={fid("discount")}>Discount (৳)</FieldLabel>
                  <Input
                    id={fid("discount")}
                    {...num(field.value, field.onChange)}
                    aria-invalid={fieldState.invalid}
                  />
                </Field>
              )}
            />
          </div>
          {v.paymentMethod === "cod" && (
            <div className="space-y-3 rounded-lg border border-dashed p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Advance received? (optional)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Controller
                  control={form.control}
                  name="advanceAmount"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor={fid("advanceAmount")}>Advance (৳)</FieldLabel>
                      <Input
                        id={fid("advanceAmount")}
                        {...num(field.value, field.onChange)}
                      />
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="advanceMethod"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor={fid("advanceMethod")}>Method</FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id={fid("advanceMethod")} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bkash">bKash</SelectItem>
                          <SelectItem value="nagad">Nagad</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              </div>
              {(v.advanceAmount ?? 0) > 0 && (
                <Controller
                  control={form.control}
                  name="advanceTrxId"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={fid("advanceTrxId")}>
                        Transaction ID
                      </FieldLabel>
                      <Input
                        {...field}
                        id={fid("advanceTrxId")}
                        className="uppercase"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              )}
            </div>
          )}
          <dl className="space-y-1.5 border-t pt-3 text-sm">
            <Row label="Subtotal" value={formatPrice(subtotal)} />
            <Row label="Delivery" value={formatPrice(v.deliveryCharge ?? 0)} />
            {(v.discount ?? 0) > 0 && (
              <Row label="Discount" value={`−${formatPrice(v.discount ?? 0)}`} />
            )}
            <div className="flex justify-between border-t pt-2 font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(total)}</dd>
            </div>
            {v.paymentMethod === "cod" && (
              <div className="flex justify-between text-primary">
                <dt>To collect on delivery</dt>
                <dd className="font-semibold tabular-nums">{formatPrice(due)}</dd>
              </div>
            )}
          </dl>
        </Card>

        {!order && (
          <Card title="Status">
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-label="Order status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">
                      Confirmed (spoke with customer)
                    </SelectItem>
                    <SelectItem value="pending">Pending (call later)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Card>
        )}

        <div className="flex gap-2 xl:sticky xl:top-20">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={save.isPending}>
            {order ? "Update order" : "Create order"}
          </Button>
        </div>
      </div>
    </form>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 admin-card p-4 md:p-5">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}
