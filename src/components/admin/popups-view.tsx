"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  CalendarClock,
  Copy,
  Eye,
  Image as ImageIcon,
  LayoutPanelLeft,
  Megaphone,
  Monitor,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Smartphone,
  Trash2,
  Type,
} from "lucide-react"
import Image from "next/image"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  PopupCard,
  type PopupContent,
  PopupDialog,
} from "@/components/marketing/campaign-popup"
import { useFieldId } from "@/hooks/use-field-id"
import {
  adminActions,
  type AdminPopup,
  adminQueries,
  type PopupInput,
  useAdminMutation,
  useAdminQuery,
} from "@/lib/admin/queries"
import {
  DEVICE_LABEL,
  FREQUENCY_LABEL,
  LAYOUT_LABEL,
  PAGES_LABEL,
  type PopupDevice,
  type PopupFrequency,
  type PopupLayout,
  type PopupPages,
  type PopupTrigger,
  scheduleState,
  TRIGGER_LABEL,
} from "@/lib/popups"
import { cn } from "@/lib/utils"
import { can, useAdminAuthStore } from "@/store/admin-auth-store"

import { NoAccess } from "./admin-shell"
import { PageHeader, QueryError } from "./admin-ui"

const KEYS = [["popups"]]
const SHOP = ["catalog"] as const

/* ───────────────────────── Status ───────────────────────── */

type Status = "live" | "scheduled" | "ended" | "off"

function statusOf(p: AdminPopup): Status {
  if (!p.active) return "off"
  const s = scheduleState(p)
  return s === "running" ? "live" : s
}

const STATUS_UI: Record<Status, { label: string; className: string }> = {
  live: { label: "Live", className: "bg-emerald-100 text-emerald-800" },
  scheduled: { label: "Scheduled", className: "bg-sky-100 text-sky-800" },
  ended: { label: "Ended", className: "bg-zinc-200 text-zinc-700" },
  off: { label: "Off", className: "bg-zinc-100 text-zinc-600" },
}

function StatusPill({ status }: { status: Status }) {
  const ui = STATUS_UI[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        ui.className
      )}
    >
      {status === "live" && (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75 motion-reduce:hidden" />
          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-600" />
        </span>
      )}
      {ui.label}
    </span>
  )
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
})

function scheduleText(p: AdminPopup) {
  if (!p.startsAt && !p.endsAt) return "No end date"
  if (p.startsAt && p.endsAt)
    return `${dateFmt.format(new Date(p.startsAt))} → ${dateFmt.format(new Date(p.endsAt))}`
  if (p.endsAt) return `Until ${dateFmt.format(new Date(p.endsAt))}`
  return `From ${dateFmt.format(new Date(p.startsAt!))}`
}

const TRIGGER_SHORT: Record<PopupTrigger, (p: AdminPopup) => string> = {
  ON_LOAD: () => "On page open",
  DELAY: (p) => `After ${p.delaySeconds}s`,
  SCROLL: (p) => `At ${p.scrollPercent}% scroll`,
  EXIT_INTENT: () => "Exit intent",
}

/* ───────────────────────── List ───────────────────────── */

export function PopupsView() {
  const role = useAdminAuthStore((s) => s.admin?.role)
  const { data, error, refetch } = useAdminQuery(["popups"], adminQueries.popups, {
    enabled: can.manage(role),
  })
  const [editing, setEditing] = useState<AdminPopup | null | undefined>(undefined)
  const [previewing, setPreviewing] = useState<AdminPopup | null>(null)

  const save = useAdminMutation(
    ({ id, body }: { id: string | null; body: PopupInput }) =>
      adminActions.savePopup(id, body),
    {
      invalidate: KEYS,
      shop: [...SHOP],
      success: (_r, v) => (v.id ? "Popup updated" : "Popup created"),
      onSuccess: () => setEditing(undefined),
    }
  )
  const toggle = useAdminMutation(
    ({ id, active }: { id: string; active: boolean }) =>
      adminActions.setPopupActive(id, active),
    {
      invalidate: KEYS,
      shop: [...SHOP],
      success: (_r, v) => (v.active ? "Popup is on" : "Popup is off"),
    }
  )
  const duplicate = useAdminMutation((id: string) => adminActions.duplicatePopup(id), {
    invalidate: KEYS,
    success: "Copy created (switched off)",
  })
  const reset = useAdminMutation((id: string) => adminActions.resetPopupStats(id), {
    invalidate: KEYS,
    success: "Stats reset",
  })
  const remove = useAdminMutation((id: string) => adminActions.deletePopup(id), {
    invalidate: KEYS,
    shop: [...SHOP],
    success: "Popup deleted",
  })

  if (!can.manage(role)) return <NoAccess />
  if (error) return <QueryError error={error} onRetry={() => void refetch()} />

  const list = data ?? []
  const live = list.filter((p) => statusOf(p) === "live")

  return (
    <div>
      <PageHeader
        title="Campaign Popups"
        description="Sale and announcement popups on the shop. A visitor sees at most one per visit."
      >
        <Button onClick={() => setEditing(null)}>
          <Plus /> New popup
        </Button>
      </PageHeader>

      {live.length > 1 && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {live.length} popups are live. On a page where several match, the one with the
          lowest priority number shows first.
        </p>
      )}

      {!data ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
      ) : list.length === 0 ? (
        <EmptyState onCreate={() => setEditing(null)} />
      ) : (
        <ul className="space-y-3">
          {list.map((p) => {
            const status = statusOf(p)
            const ctr = p.views ? (p.clicks / p.views) * 100 : null
            return (
              <li
                key={p.id}
                className="flex flex-col gap-4 rounded-xl border bg-card p-3 sm:flex-row sm:items-center"
              >
                <button
                  type="button"
                  onClick={() => setPreviewing(p)}
                  className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-blush-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:w-32"
                  aria-label={`Preview ${p.name}`}
                >
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 128px, 100vw"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <span className="grid h-full place-items-center px-2 text-center font-display text-sm text-espresso">
                      {p.title}
                    </span>
                  )}
                </button>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{p.name}</p>
                    <StatusPill status={status} />
                  </div>
                  <p className="line-clamp-1 text-sm text-muted-foreground">{p.title}</p>
                  <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                    <Chip>{LAYOUT_LABEL[p.layout]}</Chip>
                    <Chip>{TRIGGER_SHORT[p.trigger](p)}</Chip>
                    <Chip>{FREQUENCY_LABEL[p.frequency]}</Chip>
                    {p.pages !== "ALL" && <Chip>{PAGES_LABEL[p.pages]}</Chip>}
                    {p.device !== "ALL" && <Chip>{DEVICE_LABEL[p.device]}</Chip>}
                    {p.couponCode && <Chip>Code {p.couponCode}</Chip>}
                  </div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarClock className="size-3.5" /> {scheduleText(p)}
                  </p>
                </div>

                <dl className="grid grid-cols-3 gap-4 text-center sm:w-56">
                  <Stat label="Views" value={p.views.toLocaleString()} />
                  <Stat label="Clicks" value={p.clicks.toLocaleString()} />
                  <Stat label="CTR" value={ctr == null ? "–" : `${ctr.toFixed(1)}%`} />
                </dl>

                <div className="flex items-center justify-end gap-1 border-t pt-3 sm:border-0 sm:pt-0">
                  <Switch
                    checked={p.active}
                    disabled={toggle.isPending}
                    onCheckedChange={(active) => toggle.mutate({ id: p.id, active })}
                    aria-label={`${p.active ? "Turn off" : "Turn on"} ${p.name}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${p.name}`}
                    onClick={() => setEditing(p)}
                  >
                    <Pencil />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`More for ${p.name}`}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setPreviewing(p)}>
                        <Eye /> Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => duplicate.mutate(p.id)}>
                        <Copy /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!p.views && !p.clicks}
                        onSelect={() => {
                          if (window.confirm(`Reset views and clicks of "${p.name}"?`))
                            reset.mutate(p.id)
                        }}
                      >
                        <RotateCcw /> Reset stats
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => {
                          if (
                            window.confirm(
                              `Delete popup "${p.name}"? This can't be undone.`
                            )
                          )
                            remove.mutate(p.id)
                        }}
                      >
                        <Trash2 /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog
        open={editing !== undefined}
        onOpenChange={(o) => !o && setEditing(undefined)}
      >
        <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-6xl">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle>
              {editing ? `Edit "${editing.name}"` : "New campaign popup"}
            </DialogTitle>
            <DialogDescription>
              Changes reach the shop within a minute of saving.
            </DialogDescription>
          </DialogHeader>
          {editing !== undefined && (
            <PopupForm
              key={editing?.id ?? "new"}
              popup={editing}
              saving={save.isPending}
              onCancel={() => setEditing(undefined)}
              onSave={(body) => save.mutate({ id: editing?.id ?? null, body })}
            />
          )}
        </DialogContent>
      </Dialog>

      <PopupDialog
        popup={previewing}
        open={!!previewing}
        onOpenChange={(o) => !o && setPreviewing(null)}
        preview
      />
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border bg-background px-2 py-0.5">{children}</span>
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-blush-soft text-gold-ink">
        <Megaphone className="size-6" />
      </span>
      <h2 className="mt-4 font-semibold">No campaign popups yet</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Announce a sale, share a coupon code or welcome new visitors. Schedule it, pick
        when it appears, and track how many people click.
      </p>
      <Button className="mt-5" onClick={onCreate}>
        <Plus /> Create your first popup
      </Button>
    </div>
  )
}

/* ───────────────────────── Form ───────────────────────── */

const optionalUrl = z.union([
  z.url("Enter a full image URL (https://...)"),
  z.literal(""),
])
const optionalHref = z.union([
  z
    .string()
    .trim()
    .regex(/^(\/|https?:\/\/)/, "Use a path like /products or a full URL"),
  z.literal(""),
])
const wholeNumber = (min: number, max: number) =>
  z
    .string()
    .regex(/^\d+$/, "Whole number")
    .refine((v) => +v >= min && +v <= max, `Between ${min} and ${max}`)

const formSchema = z
  .object({
    name: z.string().trim().min(2, "Give it a name you'll recognise").max(80),
    active: z.boolean(),
    priority: wholeNumber(0, 1000),
    layout: z.enum(["IMAGE", "SPLIT", "TEXT"]),
    image: optionalUrl,
    badge: z.string().trim().max(40),
    title: z.string().trim().min(2, "Enter a headline").max(120),
    subtitle: z.string().trim().max(300),
    cta: z.string().trim().max(30),
    href: optionalHref,
    couponCode: z.string(),
    trigger: z.enum(["ON_LOAD", "DELAY", "SCROLL", "EXIT_INTENT"]),
    delaySeconds: wholeNumber(1, 300),
    scrollPercent: wholeNumber(5, 95),
    frequency: z.enum(["ONCE", "DAILY", "SESSION", "ALWAYS"]),
    pages: z.enum(["ALL", "HOME", "SHOPPING"]),
    device: z.enum(["ALL", "MOBILE", "DESKTOP"]),
    startsAt: z.string(),
    endsAt: z.string(),
    showCountdown: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message })
    if (v.layout !== "TEXT" && !v.image) issue("image", "This layout needs an image")
    if (v.cta && !v.href) issue("href", "Where should the button go?")
    if (v.startsAt && v.endsAt && new Date(v.endsAt) <= new Date(v.startsAt))
      issue("endsAt", "End must be after the start")
    if (v.showCountdown && !v.endsAt) issue("endsAt", "Set an end time for the countdown")
  })
type FormValues = z.infer<typeof formSchema>

/** ISO → value for <input type="datetime-local"> in the admin's own time zone */
function toLocalInput(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null)

const NO_COUPON = "__none"

const DEFAULTS: FormValues = {
  name: "",
  active: true,
  priority: "0",
  layout: "SPLIT",
  image: "",
  badge: "",
  title: "",
  subtitle: "",
  cta: "Shop now",
  href: "/products",
  couponCode: "",
  trigger: "DELAY",
  delaySeconds: "5",
  scrollPercent: "40",
  frequency: "DAILY",
  pages: "ALL",
  device: "ALL",
  startsAt: "",
  endsAt: "",
  showCountdown: false,
}

/** Quick starts for a new popup */
const TEMPLATES: { label: string; values: Partial<FormValues> }[] = [
  {
    label: "Sale with countdown",
    values: {
      name: "Sale",
      layout: "SPLIT",
      badge: "Limited time",
      title: "Mega Sale: up to 50% off",
      subtitle: "Sarees, three-pieces and more. Online only, while stock lasts.",
      cta: "Shop the sale",
      href: "/products?onSale=1",
      trigger: "DELAY",
      delaySeconds: "4",
      frequency: "DAILY",
      showCountdown: true,
    },
  },
  {
    label: "Designed banner",
    values: {
      name: "Poster",
      layout: "IMAGE",
      title: "Sale banner",
      cta: "",
      href: "/products",
      trigger: "ON_LOAD",
      frequency: "DAILY",
    },
  },
  {
    label: "Coupon for new visitors",
    values: {
      name: "Welcome coupon",
      layout: "TEXT",
      badge: "Welcome to Elora",
      title: "10% off your first order",
      subtitle: "Copy the code below. We'll add it to your cart for you.",
      cta: "Start shopping",
      href: "/products",
      trigger: "EXIT_INTENT",
      frequency: "ONCE",
    },
  },
  {
    label: "Announcement",
    values: {
      name: "Announcement",
      layout: "TEXT",
      badge: "News",
      title: "Free delivery on orders over ৳3000",
      subtitle: "All over Bangladesh, this week only.",
      cta: "",
      href: "",
      trigger: "SCROLL",
      scrollPercent: "30",
      frequency: "SESSION",
    },
  },
]

function toForm(p: AdminPopup | null): FormValues {
  if (!p) return DEFAULTS
  return {
    name: p.name,
    active: p.active,
    priority: String(p.priority),
    layout: p.layout,
    image: p.image ?? "",
    badge: p.badge ?? "",
    title: p.title,
    subtitle: p.subtitle ?? "",
    cta: p.cta ?? "",
    href: p.href ?? "",
    couponCode: p.couponCode ?? "",
    trigger: p.trigger,
    delaySeconds: String(p.delaySeconds),
    scrollPercent: String(p.scrollPercent),
    frequency: p.frequency,
    pages: p.pages,
    device: p.device,
    startsAt: toLocalInput(p.startsAt),
    endsAt: toLocalInput(p.endsAt),
    showCountdown: p.showCountdown,
  }
}

function toBody(v: FormValues): PopupInput {
  const orNull = (s: string) => s.trim() || null
  return {
    name: v.name.trim(),
    active: v.active,
    priority: Number(v.priority),
    layout: v.layout,
    image: orNull(v.image),
    badge: orNull(v.badge),
    title: v.title.trim(),
    subtitle: orNull(v.subtitle),
    cta: orNull(v.cta),
    href: orNull(v.href),
    couponCode: orNull(v.couponCode),
    trigger: v.trigger,
    delaySeconds: Number(v.delaySeconds),
    scrollPercent: Number(v.scrollPercent),
    frequency: v.frequency,
    pages: v.pages,
    device: v.device,
    startsAt: fromLocalInput(v.startsAt),
    endsAt: fromLocalInput(v.endsAt),
    showCountdown: v.showCountdown,
  }
}

const LAYOUT_OPTIONS: { value: PopupLayout; icon: typeof ImageIcon; hint: string }[] = [
  { value: "SPLIT", icon: LayoutPanelLeft, hint: "Photo + your text" },
  { value: "IMAGE", icon: ImageIcon, hint: "A ready-made design" },
  { value: "TEXT", icon: Type, hint: "Brand colours, no photo" },
]

const IMAGE_HINT: Record<PopupLayout, string> = {
  SPLIT: "Portrait or square photo, at least 800px wide.",
  IMAGE: "Your full design with all text inside it. 3:2 or 4:5, at least 1200px wide.",
  TEXT: "Not used in this layout.",
}

function PopupForm({
  popup,
  saving,
  onSave,
  onCancel,
}: {
  popup: AdminPopup | null
  saving: boolean
  onSave: (body: PopupInput) => void
  onCancel: () => void
}) {
  const fid = useFieldId()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toForm(popup),
    mode: "onTouched",
  })
  const values = useWatch({ control: form.control }) as FormValues
  const { data: coupons } = useAdminQuery(["coupons"], adminQueries.coupons)
  const [device, setDevice] = useState<"mobile" | "desktop">("desktop")

  const previewContent: PopupContent = {
    badge: values.badge || null,
    title: values.title,
    subtitle: values.subtitle || null,
    image: values.image || null,
    cta: values.cta || null,
    href: values.href || null,
    couponCode: values.couponCode || null,
    layout: values.layout,
    endsAt: fromLocalInput(values.endsAt),
    showCountdown: values.showCountdown,
  }

  const applyTemplate = (t: (typeof TEMPLATES)[number]) =>
    form.reset({ ...DEFAULTS, ...t.values }, { keepDefaultValues: true })

  const text = (
    name: keyof FormValues,
    label: string,
    opts: { placeholder?: string; hint?: string; type?: string; multiline?: boolean } = {}
  ) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={fid(name)}>{label}</FieldLabel>
          {opts.multiline ? (
            <Textarea
              {...field}
              value={String(field.value)}
              id={fid(name)}
              rows={2}
              placeholder={opts.placeholder}
              aria-invalid={fieldState.invalid}
            />
          ) : (
            <Input
              {...field}
              value={String(field.value)}
              id={fid(name)}
              type={opts.type}
              placeholder={opts.placeholder}
              aria-invalid={fieldState.invalid}
            />
          )}
          {opts.hint && !fieldState.invalid && (
            <FieldDescription>{opts.hint}</FieldDescription>
          )}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )

  const select = <T extends string>(
    name: "trigger" | "frequency" | "pages" | "device",
    label: string,
    options: Record<T, string>,
    hint?: string
  ) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <Field>
          <FieldLabel htmlFor={fid(name)}>{label}</FieldLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger id={fid(name)} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(options) as T[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {options[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hint && <FieldDescription>{hint}</FieldDescription>}
        </Field>
      )}
    />
  )

  const triggerHint: Record<PopupTrigger, string> = {
    ON_LOAD: "Shows right away. Strong, but can feel pushy.",
    DELAY: "Gives visitors a moment to look around first. Recommended.",
    SCROLL: "Shows once they're interested enough to scroll.",
    EXIT_INTENT: "Desktop: when the mouse leaves the page. Phones: after 20 seconds.",
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((v) => onSave(toBody(v)))}
      className="grid lg:grid-cols-[minmax(0,1fr)_440px]"
    >
      <div className="space-y-8 px-5 py-5">
        {!popup && (
          <section>
            <p className="mb-2 text-sm font-medium">Start from a template</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <Button
                  key={t.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(t)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </section>
        )}

        <Section title="Design">
          <div role="radiogroup" aria-label="Layout" className="grid grid-cols-3 gap-2">
            {LAYOUT_OPTIONS.map(({ value, icon: Icon, hint }) => {
              const selected = values.layout === value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => form.setValue("layout", value, { shouldValidate: true })}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    selected
                      ? "border-espresso bg-blush-soft ring-1 ring-espresso"
                      : "hover:bg-muted"
                  )}
                >
                  <Icon className="size-5" />
                  <span className="text-sm font-medium">{LAYOUT_LABEL[value]}</span>
                  <span className="text-xs text-muted-foreground">{hint}</span>
                </button>
              )
            })}
          </div>
          {values.layout !== "TEXT" &&
            text("image", "Image URL", {
              placeholder: "https://...",
              hint: IMAGE_HINT[values.layout],
            })}
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            {text("badge", "Small label", { placeholder: "Limited time" })}
            {text(
              "title",
              values.layout === "IMAGE" ? "Title (for screen readers)" : "Headline",
              {
                placeholder: "Winter Sale: up to 50% off",
              }
            )}
          </div>
          {values.layout !== "IMAGE" &&
            text("subtitle", "Description", {
              multiline: true,
              placeholder: "Online only. Selected items.",
            })}
          <div className="grid gap-4 sm:grid-cols-2">
            {text("cta", "Button text", {
              placeholder: "Shop now",
              hint: "Leave empty for no button",
            })}
            {text("href", "Button link", { placeholder: "/category/saree" })}
          </div>
          <Controller
            control={form.control}
            name="couponCode"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={fid("couponCode")}>Coupon code</FieldLabel>
                <Select
                  value={field.value || NO_COUPON}
                  onValueChange={(v) => field.onChange(v === NO_COUPON ? "" : v)}
                >
                  <SelectTrigger id={fid("couponCode")} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_COUPON}>No coupon</SelectItem>
                    {coupons?.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} · {c.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Shows a copy button. The code is also saved to the visitor&apos;s cart.
                </FieldDescription>
              </Field>
            )}
          />
        </Section>

        <Section title="When and where">
          <div className="grid gap-4 sm:grid-cols-2">
            {select("trigger", "Show it", TRIGGER_LABEL, triggerHint[values.trigger])}
            {values.trigger === "DELAY" &&
              text("delaySeconds", "Seconds to wait", { type: "number" })}
            {values.trigger === "SCROLL" &&
              text("scrollPercent", "Scrolled down (%)", { type: "number" })}
            {select(
              "frequency",
              "How often",
              FREQUENCY_LABEL as Record<PopupFrequency, string>,
              "Clicking the button stops it showing to that visitor again."
            )}
            {select(
              "pages",
              "Pages",
              PAGES_LABEL as Record<PopupPages, string>,
              "Never shown on cart, checkout, login or account pages."
            )}
            {select("device", "Devices", DEVICE_LABEL as Record<PopupDevice, string>)}
          </div>
        </Section>

        <Section title="Schedule">
          <div className="grid gap-4 sm:grid-cols-2">
            {text("startsAt", "Starts", {
              type: "datetime-local",
              hint: "Empty = as soon as it's on",
            })}
            {text("endsAt", "Ends", { type: "datetime-local", hint: "Empty = no end" })}
          </div>
          <SwitchRow
            control={form.control}
            name="showCountdown"
            label="Show a countdown"
            hint="Counts down to the end time. Urgency helps sales."
          />
        </Section>

        <Section title="Settings">
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            {text("name", "Internal name", {
              placeholder: "Eid sale 2026",
              hint: "Only admins see this",
            })}
            {text("priority", "Priority", { type: "number", hint: "0 shows first" })}
          </div>
          <SwitchRow
            control={form.control}
            name="active"
            label="Turned on"
            hint="Off keeps it saved but hidden from the shop."
          />
        </Section>
      </div>

      {/* Live preview */}
      <aside className="border-t bg-muted/40 px-5 py-5 lg:border-t-0 lg:border-l">
        <div className="lg:sticky lg:top-0">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Live preview</p>
            <div
              className="flex rounded-md border bg-background p-0.5"
              role="group"
              aria-label="Preview size"
            >
              {(["desktop", "mobile"] as const).map((d) => (
                <Button
                  key={d}
                  type="button"
                  size="icon-sm"
                  variant={device === d ? "secondary" : "ghost"}
                  aria-pressed={device === d}
                  aria-label={d === "desktop" ? "Desktop" : "Mobile"}
                  onClick={() => setDevice(d)}
                >
                  {d === "desktop" ? <Monitor /> : <Smartphone />}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid min-h-80 place-items-center overflow-hidden rounded-xl bg-espresso/55 p-4">
            <div
              className={cn(
                "overflow-hidden bg-card shadow-2xl",
                device === "mobile" ? "w-[320px] rounded-t-3xl" : "rounded-2xl"
              )}
              style={
                device === "desktop"
                  ? { width: values.layout === "TEXT" ? 448 : 768, zoom: 0.5 }
                  : undefined
              }
            >
              <PopupCard popup={previewContent} onClose={() => {}} preview />
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? "Saving..." : popup ? "Save changes" : "Create popup"}
            </Button>
          </div>
        </div>
      </aside>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

function SwitchRow({
  control,
  name,
  label,
  hint,
}: {
  control: ReturnType<typeof useForm<FormValues>>["control"]
  name: "showCountdown" | "active"
  label: string
  hint: string
}) {
  const fid = useFieldId()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-center justify-between gap-4 rounded-lg border bg-background p-3">
          <div>
            <label htmlFor={fid(name)} className="text-sm font-medium">
              {label}
            </label>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
          <Switch id={fid(name)} checked={field.value} onCheckedChange={field.onChange} />
        </div>
      )}
    />
  )
}
