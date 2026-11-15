"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Info } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useFieldId } from "@/hooks/use-field-id"
import {
  adminActions,
  adminQueries,
  type StoreSettings,
  useAdminMutation,
  useAdminQuery,
} from "@/lib/admin/queries"
import { adminBdPhoneSchema } from "@/lib/validations/common"
import { can, useAdminAuthStore } from "@/store/admin-auth-store"

import { PageHeader, QueryError } from "./admin-ui"

const taka = z.number({ error: "Enter a number" }).int().min(0, "Must be 0 or more")

const settingsSchema = z.object({
  storeName: z.string().trim().min(2, "Enter a name"),
  phone: z.string().trim().min(6, "Enter a phone number"),
  email: z.email("Enter a valid email"),
  whatsapp: z
    .string()
    .trim()
    .regex(/^8801[3-9]\d{8}$/, "Must start with 880, e.g. 8801712345678"),
  address: z.string().trim().min(3, "Enter an address"),
  announcement: z.string().max(120),
  delivery: z.object({
    insideDhaka: taka,
    outsideDhaka: taka,
    freeDeliveryMinimum: taka,
  }),
  courierCharge: z.object({ insideDhaka: taka, outsideDhaka: taka }),
  payments: z
    .object({
      cod: z.boolean(),
      bkash: z.boolean(),
      nagad: z.boolean(),
      sslcommerz: z.boolean(),
    })
    .refine(
      (p) => Object.values(p).some(Boolean),
      "Keep at least one payment method enabled"
    ),
  advance: z.object({
    mode: z.enum(["none", "delivery-charge", "outside-dhaka"]),
    bkashNumber: adminBdPhoneSchema,
    nagadNumber: adminBdPhoneSchema,
  }),
  invoiceLang: z.enum(["en", "bn"]),
  newOrderSound: z.boolean(),
  tracking: z.object({
    fbPixelId: z
      .string()
      .trim()
      .regex(/^(\d{10,20})?$/, "Pixel ID is a 15–16 digit number"),
    capiTestCode: z.string().trim().max(40),
    gtmId: z
      .string()
      .trim()
      .regex(/^(GTM-[A-Z0-9]{4,12})?$/i, "Looks like GTM-XXXXXXX"),
    ga4Id: z
      .string()
      .trim()
      .regex(/^(G-[A-Z0-9]{4,15})?$/i, "Looks like G-XXXXXXXXXX"),
  }),
})

const TRACKING_FIELDS = [
  {
    key: "fbPixelId",
    label: "Facebook Pixel ID",
    placeholder: "123456789012345",
    desc: "Events Manager → Data sources → your pixel",
  },
  {
    key: "capiTestCode",
    label: "CAPI test event code (optional)",
    placeholder: "TEST12345",
    desc: "Only while testing in Events Manager → Test events",
  },
  {
    key: "gtmId",
    label: "Google Tag Manager ID",
    placeholder: "GTM-XXXXXXX",
    desc: "If set, GA4 should be configured inside GTM",
  },
  {
    key: "ga4Id",
    label: "Google Analytics 4 ID",
    placeholder: "G-XXXXXXXXXX",
    desc: "Used only when GTM is empty",
  },
] as const

const PAYMENTS = [
  { key: "cod", label: "Cash on Delivery" },
  { key: "bkash", label: "bKash" },
  { key: "nagad", label: "Nagad" },
  { key: "sslcommerz", label: "Card / Online Banking" },
] as const

export function SettingsView() {
  const { data, error, refetch } = useAdminQuery(["settings"], adminQueries.settings)
  if (error) return <QueryError error={error} onRetry={() => void refetch()} />
  if (!data)
    return <p className="py-16 text-center text-sm text-muted-foreground">Loading...</p>
  // Remount when the saved settings change so the form shows them
  return <SettingsForm key={JSON.stringify(data)} settings={data} />
}

function SettingsForm({ settings }: { settings: StoreSettings }) {
  const fid = useFieldId()
  const role = useAdminAuthStore((s) => s.admin?.role)
  const isOwner = can.own(role)
  const form = useForm({
    resolver: zodResolver(settingsSchema),
    mode: "onTouched",
    defaultValues: settings,
  })
  const err = form.formState.errors
  const save = useAdminMutation((v: StoreSettings) => adminActions.saveSettings(v), {
    invalidate: [["settings"]],
    shop: ["settings"],
    success: "Settings saved",
  })

  const onSubmit = form.handleSubmit((v) => save.mutate(v as StoreSettings))

  const text = (
    name: "storeName" | "phone" | "email" | "whatsapp" | "address",
    label: string,
    desc?: string
  ) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={fid(name)}>{label}</FieldLabel>
          <Input {...field} id={fid(name)} aria-invalid={fieldState.invalid} />
          {desc && <FieldDescription>{desc}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )

  const money = (
    name:
      | "delivery.insideDhaka"
      | "delivery.outsideDhaka"
      | "delivery.freeDeliveryMinimum"
      | "courierCharge.insideDhaka"
      | "courierCharge.outsideDhaka",
    label: string
  ) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={fid(name)}>{label}</FieldLabel>
          <Input
            id={fid(name)}
            type="number"
            min={0}
            value={field.value ?? ""}
            onChange={(e) =>
              field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
            }
            onBlur={field.onBlur}
            aria-invalid={fieldState.invalid}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )

  return (
    <form onSubmit={onSubmit} noValidate>
      <PageHeader title="Settings" description="General shop settings">
        {isOwner && (
          <Button type="submit" disabled={!form.formState.isDirty || save.isPending}>
            Save
          </Button>
        )}
      </PageHeader>

      <p className="mb-6 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <Info className="size-4 shrink-0" />
        {isOwner
          ? "Changes reach the shop (header, footer, checkout charges, payment options) as soon as you save."
          : "Only the shop owner can change settings."}
      </p>

      <fieldset disabled={!isOwner} className="contents">
        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Store Info">
            {text("storeName", "Shop name")}
            <div className="grid gap-4 sm:grid-cols-2">
              {text("phone", "Phone")}
              {text("email", "Email")}
            </div>
            {text("whatsapp", "WhatsApp number", "Starts with 880 (e.g. 8801712345678)")}
            {text("address", "Address")}
            <Controller
              control={form.control}
              name="announcement"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={fid("announcement")}>Top bar text</FieldLabel>
                  <Textarea
                    {...field}
                    id={fid("announcement")}
                    rows={2}
                    placeholder="If left empty: Free delivery on orders over ৳2,000"
                  />
                  <FieldDescription>
                    Shown in the green bar at the top of every page
                  </FieldDescription>
                </Field>
              )}
            />
          </Card>

          <div className="space-y-6">
            <Card title="Delivery Charge (paid by customer)">
              <div className="grid gap-4 sm:grid-cols-3">
                {money("delivery.insideDhaka", "Inside Dhaka (৳)")}
                {money("delivery.outsideDhaka", "Outside Dhaka (৳)")}
                {money("delivery.freeDeliveryMinimum", "Free delivery (৳+)")}
              </div>
            </Card>
            <Card title="Courier Charge (we pay the courier)">
              <div className="grid gap-4 sm:grid-cols-2">
                {money("courierCharge.insideDhaka", "Inside Dhaka (৳)")}
                {money("courierCharge.outsideDhaka", "Outside Dhaka (৳)")}
              </div>
              <p className="text-xs text-muted-foreground">
                Used for profit & loss and COD calculations
              </p>
            </Card>
          </div>

          <Card title="Payment Method">
            {PAYMENTS.map(({ key, label }) => (
              <Controller
                key={key}
                control={form.control}
                name={`payments.${key}`}
                render={({ field }) => (
                  <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                    {label}
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label={label}
                    />
                  </label>
                )}
              />
            ))}
            {err.payments?.root?.message || err.payments?.message ? (
              <p className="text-sm text-destructive">
                {err.payments?.root?.message ?? err.payments?.message}
              </p>
            ) : null}
          </Card>

          <Card title="Advance Payment (to prevent fake orders)">
            <Controller
              control={form.control}
              name="advance.mode"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={fid("advanceMode")}>
                    Advance on COD orders
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={fid("advanceMode")} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not required</SelectItem>
                      <SelectItem value="outside-dhaka">
                        Delivery charge, outside Dhaka only
                      </SelectItem>
                      <SelectItem value="delivery-charge">
                        Delivery charge on all orders
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Customers enter a bKash/Nagad Transaction ID at checkout; you verify
                    it on the order page
                  </FieldDescription>
                </Field>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {(["bkashNumber", "nagadNumber"] as const).map((n) => (
                <Controller
                  key={n}
                  control={form.control}
                  name={`advance.${n}`}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={fid(n)}>
                        {n === "bkashNumber" ? "bKash" : "Nagad"} number (Send Money)
                      </FieldLabel>
                      <Input
                        {...field}
                        id={fid(n)}
                        type="tel"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              ))}
            </div>
          </Card>

          <Card title="Facebook Pixel & Google Tracking">
            {TRACKING_FIELDS.map(({ key, label, placeholder, desc }) => (
              <Controller
                key={key}
                control={form.control}
                name={`tracking.${key}`}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={fid(key)}>{label}</FieldLabel>
                    <Input
                      {...field}
                      id={fid(key)}
                      placeholder={placeholder}
                      autoComplete="off"
                      spellCheck={false}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>{desc}</FieldDescription>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            ))}
            <p className="text-xs text-muted-foreground">
              Tracked events: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase
              (with event ID for CAPI de-duplication), Search. Pixels load on the live
              site only, never in the admin panel.
            </p>
          </Card>

          <Card title="Invoice & Notifications">
            <Controller
              control={form.control}
              name="invoiceLang"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={fid("invoiceLang")}>Invoice language</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={fid("invoiceLang")} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="bn">বাংলা (Bangla)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>Used for printed invoices</FieldDescription>
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="newOrderSound"
              render={({ field }) => (
                <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                  <span>
                    New order sound
                    <span className="block text-xs text-muted-foreground">
                      Beep + popup in the admin panel when a website order arrives
                    </span>
                  </span>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="New order sound"
                  />
                </label>
              )}
            />
          </Card>
        </div>
      </fieldset>
    </form>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-4 md:p-5">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  )
}
