"use client"

import { Download, Plus, Trash2, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { useFieldId } from "@/hooks/use-field-id"
import { bdDay, downloadCsv } from "@/lib/admin/finance"
import {
  adminActions,
  adminQueries,
  useAdminMutation,
  useAdminQuery,
} from "@/lib/admin/queries"
import { getErrorMessage } from "@/lib/api"
import { formatDate, formatPhone, formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { can, useAdminAuthStore } from "@/store/admin-auth-store"

import { NoAccess } from "./admin-shell"
import { PageHeader, Pager, QueryError } from "./admin-ui"

const num = (v: string) => (v === "" ? 0 : Math.max(0, Number(v) || 0))
const variantName = (v: { color: string | null; size: string | null }) =>
  [v.color, v.size].filter(Boolean).join(" / ")
const STOCK_KEYS = [["purchases"], ["suppliers"], ["products"], ["dashboard"]]

export function PurchasesView() {
  const role = useAdminAuthStore((s) => s.admin?.role)
  const allowed = can.manage(role)
  const [tab, setTab] = useState<"purchases" | "suppliers">("purchases")
  const {
    data: suppliers,
    error,
    refetch,
  } = useAdminQuery(["suppliers"], adminQueries.suppliers, { enabled: allowed })
  const { data: month } = useAdminQuery(
    ["purchases", "this-month"],
    () => adminQueries.purchases({ limit: 100 }),
    { enabled: allowed }
  )

  if (!allowed) return <NoAccess />
  if (error) return <QueryError error={error} onRetry={() => void refetch()} />

  const monthStart = `${bdDay(new Date()).slice(0, 7)}-01`
  const thisMonth = (month?.data ?? [])
    .filter((p) => p.date >= monthStart)
    .reduce((s, p) => s + p.total, 0)
  const totalDue = (suppliers ?? []).reduce((s, x) => s + x.due, 0)

  return (
    <div>
      <PageHeader
        title="Purchases & Suppliers"
        description="Stock you buy from suppliers — adds to stock and tracks what you owe"
      >
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const all = await adminQueries.purchases({ limit: 100 })
              downloadCsv(
                "purchases.csv",
                ["Date", "Supplier", "Products", "Total", "Paid", "Note"],
                all.data.map((p) => [
                  p.date,
                  p.supplier?.name ?? "",
                  p.lines
                    .map(
                      (l) =>
                        `${l.name}${l.variant ? ` (${l.variant})` : ""} x${l.quantity} @${l.unitCost}`
                    )
                    .join("; "),
                  p.total,
                  p.paid,
                  p.note ?? "",
                ])
              )
            } catch (e) {
              toast.error(getErrorMessage(e))
            }
          }}
        >
          <Download /> CSV
        </Button>
      </PageHeader>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Bought this month" value={formatPrice(thisMonth)} />
        <Stat
          label="Owed to suppliers"
          value={formatPrice(totalDue)}
          bad={totalDue > 0}
        />
        <Stat label="Suppliers" value={String(suppliers?.length ?? "—")} />
      </div>

      <div className="mb-4 flex gap-1.5">
        {(["purchases", "suppliers"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm capitalize transition-colors",
              tab === t
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:border-primary"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "purchases" ? (
        <PurchasesTab onNeedSupplier={() => setTab("suppliers")} />
      ) : (
        <SuppliersTab />
      )}
    </div>
  )
}

function Stat({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-bold tabular-nums", bad && "text-destructive")}>
        {value}
      </p>
    </div>
  )
}

interface LineDraft {
  productId: string
  variantId: string
  quantity: string
  unitCost: string
}

const blankLine = (): LineDraft => ({
  productId: "",
  variantId: "",
  quantity: "",
  unitCost: "",
})

function PurchasesTab({ onNeedSupplier }: { onNeedSupplier: () => void }) {
  const fid = useFieldId()
  const { data: productPage } = useAdminQuery(["products", "picker"], () =>
    adminQueries.products({ limit: 500 })
  )
  const products = productPage?.data ?? []
  const { data: suppliers = [] } = useAdminQuery(["suppliers"], adminQueries.suppliers)
  const [page, setPage] = useState(1)
  const { data: history } = useAdminQuery(
    ["purchases", "list", page],
    () => adminQueries.purchases({ page, limit: 20 }),
    { placeholderData: (prev) => prev }
  )
  const [date, setDate] = useState(() => bdDay(new Date()))
  const [supplierId, setSupplierId] = useState("")
  const [lines, setLines] = useState<LineDraft[]>([blankLine()])
  const [paid, setPaid] = useState("")
  const [note, setNote] = useState("")
  const [updateCost, setUpdateCost] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const total = lines.reduce((s, l) => s + num(l.quantity) * num(l.unitCost), 0)
  const setLine = (i: number, patch: Partial<LineDraft>) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)))

  const add = useAdminMutation(adminActions.addPurchase, {
    invalidate: STOCK_KEYS,
    shop: ["catalog"],
    success: (p) => `Stock added — ${p.lines.reduce((s, l) => s + l.quantity, 0)} pcs`,
    onSuccess: () => {
      setLines([blankLine()])
      setPaid("")
      setNote("")
      setError(null)
    },
  })
  const remove = useAdminMutation((id: string) => adminActions.deletePurchase(id), {
    invalidate: STOCK_KEYS,
    shop: ["catalog"],
    success: "Purchase deleted, stock reversed",
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!supplierId) return setError("Select a supplier")
    for (const l of lines) {
      const p = products.find((x) => x.id === l.productId)
      if (!p) return setError("Select a product on every row")
      if (p.variants.length && !l.variantId)
        return setError(`Select a variant for ${p.name}`)
      if (num(l.quantity) < 1) return setError(`Enter a quantity for ${p.name}`)
    }
    setError(null)
    add.mutate({
      date,
      supplierId,
      lines: lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId || null,
        quantity: Math.round(num(l.quantity)),
        unitCost: num(l.unitCost),
      })),
      paid: Math.min(num(paid), total),
      note: note.trim() || undefined,
      updateCost,
    })
  }

  return (
    <div className="space-y-6">
      {suppliers.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm">
          <p className="mb-3 text-muted-foreground">Add a supplier first</p>
          <Button onClick={onNeedSupplier}>
            <Plus /> Add supplier
          </Button>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={submit}
          className="space-y-4 rounded-xl border bg-card p-4 md:p-5"
        >
          <h2 className="font-semibold">New purchase (stock in)</h2>
          <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
            <Field>
              <FieldLabel htmlFor={fid("pdate")}>Date</FieldLabel>
              <Input
                id={fid("pdate")}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={fid("psupplier")}>Supplier</FieldLabel>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger id={fid("psupplier")} className="w-full">
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="space-y-2">
            <div className="hidden grid-cols-[2fr_1.2fr_90px_110px_32px] gap-2 text-xs font-medium text-muted-foreground md:grid">
              <span>Product</span>
              <span>Variant</span>
              <span>Qty</span>
              <span>Unit cost (৳)</span>
              <span />
            </div>
            {lines.map((l, i) => {
              const p = products.find((x) => x.id === l.productId)
              return (
                <div
                  key={i}
                  className="grid grid-cols-2 gap-2 rounded-lg border p-2 md:grid-cols-[2fr_1.2fr_90px_110px_32px] md:border-0 md:p-0"
                >
                  <Select
                    value={l.productId}
                    onValueChange={(v) => {
                      const np = products.find((x) => x.id === v)
                      setLine(i, {
                        productId: v,
                        variantId: "",
                        unitCost: l.unitCost || String(np?.costPrice ?? ""),
                      })
                    }}
                  >
                    <SelectTrigger
                      className="col-span-2 w-full md:col-span-1"
                      aria-label={`Row ${i + 1} product`}
                    >
                      <SelectValue
                        placeholder={products.length ? "Product" : "Loading..."}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((x) => (
                        <SelectItem key={x.id} value={x.id}>
                          {x.name} ({x.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {p?.variants.length ? (
                    <Select
                      value={l.variantId}
                      onValueChange={(v) => setLine(i, { variantId: v })}
                    >
                      <SelectTrigger
                        className="col-span-2 w-full md:col-span-1"
                        aria-label={`Row ${i + 1} variant`}
                      >
                        <SelectValue placeholder="Variant" />
                      </SelectTrigger>
                      <SelectContent>
                        {p.variants.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {variantName(v)} ({v.stock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="col-span-2 hidden self-center text-xs text-muted-foreground md:col-span-1 md:block">
                      —
                    </span>
                  )}
                  <Input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={l.quantity}
                    onChange={(e) => setLine(i, { quantity: e.target.value })}
                    placeholder="Qty"
                    aria-label={`Row ${i + 1} quantity`}
                  />
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={l.unitCost}
                    onChange={(e) => setLine(i, { unitCost: e.target.value })}
                    placeholder="Cost"
                    aria-label={`Row ${i + 1} unit cost`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove row"
                    disabled={lines.length === 1}
                    onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                    className="col-span-2 justify-self-end md:col-span-1"
                  >
                    <X />
                  </Button>
                </div>
              )
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLines((ls) => [...ls, blankLine()])}
            >
              <Plus /> Add row
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end">
            <Field>
              <FieldLabel htmlFor={fid("pnote")}>Note</FieldLabel>
              <Input
                id={fid("pnote")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Memo no., Islampur market, etc."
                maxLength={200}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={fid("ppaid")}>Paid now (৳)</FieldLabel>
              <Input
                id={fid("ppaid")}
                type="number"
                min={0}
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
                placeholder="0"
              />
            </Field>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold tabular-nums">{formatPrice(total)}</p>
              {total - num(paid) > 0 && (
                <p className="text-xs text-destructive">
                  Due {formatPrice(total - Math.min(num(paid), total))}
                </p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm">
            <Switch checked={updateCost} onCheckedChange={setUpdateCost} />
            Update product cost price to this purchase price (for profit reports)
          </label>
          {error && <FieldError errors={[{ message: error }]} />}
          <Button type="submit" disabled={add.isPending}>
            Save & add to stock
          </Button>
        </form>
      )}

      <section className="overflow-hidden rounded-xl border bg-card">
        <h2 className="border-b px-4 py-3 font-semibold">Purchase history</h2>
        {!history ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
        ) : history.data.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No purchases yet
          </p>
        ) : (
          <ul className="divide-y">
            {history.data.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-start gap-3 px-4 py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {p.supplier?.name ?? "Supplier"}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {formatDate(p.date)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.lines
                      .map(
                        (l) =>
                          `${l.name}${l.variant ? ` (${l.variant})` : ""} ×${l.quantity} @ ${formatPrice(l.unitCost)}`
                      )
                      .join(", ")}
                  </p>
                  {p.note && <p className="text-xs">{p.note}</p>}
                </div>
                <div className="text-right tabular-nums">
                  <p className="font-semibold">{formatPrice(p.total)}</p>
                  <p className="text-xs text-muted-foreground">
                    Paid {formatPrice(p.paid)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete purchase"
                  className="hover:text-destructive"
                  disabled={remove.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Delete this purchase? Its quantities will be removed from stock."
                      )
                    )
                      remove.mutate(p.id)
                  }}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {history && (
        <Pager
          page={history.meta.page}
          totalPages={history.meta.totalPages}
          total={history.meta.total}
          onChange={setPage}
        />
      )}
    </div>
  )
}

function SuppliersTab() {
  const fid = useFieldId()
  const { data: suppliers } = useAdminQuery(["suppliers"], adminQueries.suppliers)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [payFor, setPayFor] = useState<string | null>(null)
  const [payAmount, setPayAmount] = useState("")

  const addSupplier = useAdminMutation(adminActions.addSupplier, {
    invalidate: [["suppliers"]],
    success: "Supplier added",
    onSuccess: () => {
      setName("")
      setPhone("")
      setAddress("")
    },
  })
  const removeSupplier = useAdminMutation(
    (id: string) => adminActions.deleteSupplier(id),
    {
      invalidate: [["suppliers"]],
      success: "Supplier deleted",
    }
  )
  const pay = useAdminMutation(
    ({ id, amount }: { id: string; amount: number }) =>
      adminActions.addSupplierPayment(id, { date: bdDay(new Date()), amount }),
    {
      invalidate: [["suppliers"]],
      success: "Payment saved",
      onSuccess: () => {
        setPayFor(null)
        setPayAmount("")
      },
    }
  )

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_1fr_1.5fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim().length < 2) return toast.error("Enter the supplier name")
          addSupplier.mutate({
            name: name.trim(),
            phone: phone.trim() || undefined,
            address: address.trim() || undefined,
          })
        }}
      >
        <Field>
          <FieldLabel htmlFor={fid("sname")}>Supplier name</FieldLabel>
          <Input
            id={fid("sname")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={fid("sphone")}>Phone</FieldLabel>
          <Input
            id={fid("sphone")}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={fid("saddress")}>Address</FieldLabel>
          <Input
            id={fid("saddress")}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="E.g. Islampur, Dhaka"
          />
        </Field>
        <Button type="submit" disabled={addSupplier.isPending}>
          <Plus /> Add
        </Button>
      </form>

      {!suppliers ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
      ) : suppliers.length === 0 ? (
        <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          No suppliers yet
        </p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {suppliers.map((s) => (
            <li key={s.id} className="space-y-2 p-4 text-sm">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.phone && (
                      <a href={`tel:${s.phone}`} className="text-primary">
                        {formatPhone(s.phone)}
                      </a>
                    )}
                    {s.phone && s.address && " · "}
                    {s.address}
                  </p>
                </div>
                <div className="text-right tabular-nums">
                  <p className={cn("font-semibold", s.due > 0 && "text-destructive")}>
                    Due {formatPrice(s.due)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bought {formatPrice(s.bought)} · {s.purchases} purchase(s)
                  </p>
                </div>
              </div>
              {payFor === s.id ? (
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    const amount = num(payAmount)
                    if (amount > 0) pay.mutate({ id: s.id, amount })
                  }}
                >
                  <Input
                    type="number"
                    min={1}
                    autoFocus
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Amount (৳)"
                    aria-label="Payment amount"
                    className="h-8 w-36"
                  />
                  <Button type="submit" size="sm" disabled={pay.isPending}>
                    Save payment
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setPayFor(null)}
                  >
                    Cancel
                  </Button>
                </form>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPayFor(s.id)}>
                    Record payment
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:text-destructive"
                    disabled={s.purchases > 0 || removeSupplier.isPending}
                    title="Suppliers with purchases cannot be deleted"
                    onClick={() => removeSupplier.mutate(s.id)}
                  >
                    <Trash2 /> Delete
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
