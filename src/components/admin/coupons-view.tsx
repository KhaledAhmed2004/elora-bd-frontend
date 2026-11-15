"use client"

import { useFieldId } from "@/hooks/use-field-id"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, TicketPercent, Trash2 } from "lucide-react"
import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  adminActions,
  type AdminCoupon,
  adminQueries,
  useAdminMutation,
  useAdminQuery,
} from "@/lib/admin/queries"
import { isApiStatus } from "@/lib/api"
import { formatDate, formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { can, useAdminAuthStore } from "@/store/admin-auth-store"

import { NoAccess } from "./admin-shell"
import { PageHeader, QueryError } from "./admin-ui"

type FormType = "percent" | "fixed" | "free-shipping"
const API_TYPE: Record<FormType, AdminCoupon["type"]> = {
  percent: "PERCENT",
  fixed: "FIXED",
  "free-shipping": "FREE_SHIPPING",
}
const COUPON_KEYS = [["coupons"]]

const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{3,20}$/, "3–20 letters or numbers (e.g. EID20)"),
    type: z.enum(["percent", "fixed", "free-shipping"]),
    value: z.number({ error: "Enter a value" }).min(0),
    minSubtotal: z.number().min(0).optional(),
    maxDiscount: z.number().min(0).optional(),
    usageLimit: z.number().int().min(1).optional(),
    expiresAt: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.type === "percent" && (v.value <= 0 || v.value > 90))
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Enter a value between 1 and 90%",
      })
    if (v.type === "fixed" && v.value <= 0)
      ctx.addIssue({ code: "custom", path: ["value"], message: "Enter an amount" })
  })

function describe(c: {
  type: FormType
  value: number
  minSubtotal?: number
  maxDiscount?: number
}) {
  const base =
    c.type === "percent"
      ? `${c.value}% chhar${c.maxDiscount ? ` (shorbochcho ${formatPrice(c.maxDiscount)})` : ""}`
      : c.type === "fixed"
        ? `${formatPrice(c.value)} chhar`
        : "Free delivery"
  return c.minSubtotal ? `${formatPrice(c.minSubtotal)}+ order e ${base}` : base
}

const num = (value: number | undefined, onChange: (v: number | undefined) => void) => ({
  type: "number" as const,
  min: 0,
  value: value ?? "",
  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange(e.target.value === "" ? undefined : Number(e.target.value)),
})

export function CouponsView() {
  const role = useAdminAuthStore((s) => s.admin?.role)
  const {
    data: coupons,
    error,
    refetch,
  } = useAdminQuery(["coupons"], adminQueries.coupons, {
    enabled: can.manage(role),
  })
  const [open, setOpen] = useState(false)
  const toggle = useAdminMutation(
    (c: AdminCoupon) => {
      const { usedCount: _used, ...body } = c
      return adminActions.saveCoupon(true, { ...body, active: !c.active })
    },
    { invalidate: COUPON_KEYS }
  )
  const remove = useAdminMutation((code: string) => adminActions.deleteCoupon(code), {
    invalidate: COUPON_KEYS,
    success: (_r, code) => `${code} deleted`,
  })

  if (!can.manage(role)) return <NoAccess />
  if (error) return <QueryError error={error} onRetry={() => void refetch()} />

  return (
    <div>
      <PageHeader title="Coupons" description="These coupons can be used at checkout">
        <Button onClick={() => setOpen(true)}>
          <Plus /> New Coupon
        </Button>
      </PageHeader>

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {!coupons && <p className="text-sm text-muted-foreground">Loading...</p>}
        {coupons?.map((c) => {
          const expired = c.expiresAt ? new Date(c.expiresAt) < new Date() : false
          return (
            <li
              key={c.code}
              className={cn(
                "flex flex-col rounded-xl border border-dashed bg-card p-4",
                (!c.active || expired) && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-2 font-mono text-lg font-bold">
                  <TicketPercent className="size-5 text-primary" /> {c.code}
                </span>
                <Switch
                  checked={c.active}
                  disabled={toggle.isPending}
                  onCheckedChange={() => toggle.mutate(c)}
                  aria-label={`${c.active ? "Deactivate" : "Activate"} ${c.code}`}
                />
              </div>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Used {c.usedCount}
                {c.usageLimit ? ` / ${c.usageLimit}` : ""} times
              </p>
              <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs">
                <span
                  className={cn(expired ? "text-destructive" : "text-muted-foreground")}
                >
                  {expired
                    ? "Expired"
                    : c.expiresAt
                      ? `Expires: ${formatDate(c.expiresAt)}`
                      : "No expiry"}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Delete ${c.code}`}
                  className="hover:text-destructive"
                  disabled={remove.isPending}
                  onClick={() => {
                    if (window.confirm(`Delete coupon ${c.code}?`)) remove.mutate(c.code)
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Coupon</DialogTitle>
            <DialogDescription>
              Customers get a discount by entering this code at checkout
            </DialogDescription>
          </DialogHeader>
          {open && <CouponForm onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CouponForm({ onDone }: { onDone: () => void }) {
  const fid = useFieldId()
  const create = useAdminMutation(
    (body: Omit<AdminCoupon, "usedCount">) => adminActions.saveCoupon(false, body),
    {
      invalidate: COUPON_KEYS,
      success: (c) => `${(c as AdminCoupon).code} created`,
      onSuccess: onDone,
    }
  )
  const form = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: { code: "", type: "percent" as const, value: 10, expiresAt: "" },
  })
  const type = useWatch({ control: form.control, name: "type" })

  const onSubmit = form.handleSubmit((v) => {
    const value = v.type === "free-shipping" ? 0 : v.value
    create.mutate(
      {
        code: v.code,
        type: API_TYPE[v.type],
        value,
        minSubtotal: v.minSubtotal || null,
        maxDiscount: v.type === "percent" ? v.maxDiscount || null : null,
        usageLimit: v.usageLimit || null,
        // End of the chosen day in Bangladesh
        expiresAt: v.expiresAt ? `${v.expiresAt}T23:59:59+06:00` : null,
        active: true,
        description: describe({ ...v, value }),
      },
      {
        onError: (e) => {
          if (isApiStatus(e, 409))
            form.setError("code", { message: "This code already exists" })
        },
      }
    )
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Controller
        control={form.control}
        name="code"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={fid("code")}>Code</FieldLabel>
            <Input
              {...field}
              id={fid("code")}
              placeholder="EID20"
              className="font-mono uppercase"
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={form.control}
          name="type"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={fid("type")}>Type</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={fid("type")} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">% Discount</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                  <SelectItem value="free-shipping">Free Delivery</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        />
        {type !== "free-shipping" && (
          <Controller
            control={form.control}
            name="value"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={fid("value")}>
                  {type === "percent" ? "Percent (%)" : "Amount (৳)"}
                </FieldLabel>
                <Input
                  id={fid("value")}
                  {...num(field.value, field.onChange)}
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        )}
      </div>
      <Controller
        control={form.control}
        name="usageLimit"
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor={fid("usageLimit")}>Total uses allowed</FieldLabel>
            <Input
              id={fid("usageLimit")}
              placeholder="Unlimited"
              {...num(field.value, field.onChange)}
            />
          </Field>
        )}
      />
      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={form.control}
          name="minSubtotal"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={fid("minSubtotal")}>Minimum Order (৳)</FieldLabel>
              <Input
                id={fid("minSubtotal")}
                placeholder="Optional"
                {...num(field.value, field.onChange)}
              />
            </Field>
          )}
        />
        {type === "percent" && (
          <Controller
            control={form.control}
            name="maxDiscount"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={fid("maxDiscount")}>Max Discount (৳)</FieldLabel>
                <Input
                  id={fid("maxDiscount")}
                  placeholder="Optional"
                  {...num(field.value, field.onChange)}
                />
              </Field>
            )}
          />
        )}
      </div>
      <Field>
        <FieldLabel htmlFor={fid("expiresAt")}>Expiry Date</FieldLabel>
        <Input id={fid("expiresAt")} type="date" {...form.register("expiresAt")} />
      </Field>
      <Button type="submit" className="w-full" size="lg" disabled={create.isPending}>
        Create Coupon
      </Button>
    </form>
  )
}
