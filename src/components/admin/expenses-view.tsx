"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Download, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

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
import { useFieldId } from "@/hooks/use-field-id"
import {
  bdDay,
  downloadCsv,
  type PeriodKey,
  PERIODS,
  periodDays,
} from "@/lib/admin/finance"
import {
  adminActions,
  adminQueries,
  useAdminMutation,
  useAdminQuery,
} from "@/lib/admin/queries"
import { formatDate, formatPrice } from "@/lib/format"
import { can, useAdminAuthStore } from "@/store/admin-auth-store"

import { NoAccess } from "./admin-shell"
import { PageHeader, QueryError } from "./admin-ui"

const DEFAULT_CATEGORIES = [
  "Facebook Ad",
  "Packaging",
  "Salary",
  "Rent",
  "Internet/Phone",
  "Photoshoot",
  "Other",
]

const expenseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date"),
  category: z.string().min(2),
  amount: z.number({ error: "Enter an amount" }).int().positive("Must be greater than 0"),
  note: z.string().max(200).optional(),
})

export function ExpensesView() {
  const fid = useFieldId()
  const role = useAdminAuthStore((s) => s.admin?.role)
  const allowed = can.manage(role)
  const [period, setPeriod] = useState<PeriodKey>("this-month")
  const range = periodDays(period)
  const { data, error, refetch } = useAdminQuery(
    ["expenses", period],
    () => adminQueries.expenses(range),
    { enabled: allowed }
  )
  const categories = data?.categories?.length ? data.categories : DEFAULT_CATEGORIES

  const form = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: bdDay(new Date()),
      category: "Facebook Ad",
      amount: undefined as unknown as number,
      note: "",
    },
  })
  const add = useAdminMutation(adminActions.addExpense, {
    invalidate: [["expenses"], ["reports"]],
    success: "Expense added",
    onSuccess: (_r, v) =>
      form.reset({
        date: v.date,
        category: v.category,
        amount: undefined as unknown as number,
        note: "",
      }),
  })
  const remove = useAdminMutation((id: string) => adminActions.deleteExpense(id), {
    invalidate: [["expenses"], ["reports"]],
    success: "Expense deleted",
  })

  if (!allowed) return <NoAccess />
  const list = data?.data ?? []

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Facebook ads, packaging, salaries, etc. — used to calculate net profit"
      >
        <Button
          variant="outline"
          disabled={!list.length}
          onClick={() =>
            downloadCsv(
              `expenses-${period}.csv`,
              ["Date", "Category", "Amount", "Note"],
              list.map((e) => [e.date, e.category, e.amount, e.note ?? ""])
            )
          }
        >
          <Download /> CSV
        </Button>
      </PageHeader>

      <form
        noValidate
        onSubmit={form.handleSubmit((v) =>
          add.mutate({ ...v, note: v.note || undefined })
        )}
        className="mb-6 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[160px_180px_140px_1fr_auto] lg:items-end"
      >
        <Field>
          <FieldLabel htmlFor={fid("date")}>Date</FieldLabel>
          <Input id={fid("date")} type="date" {...form.register("date")} />
        </Field>
        <Controller
          control={form.control}
          name="category"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={fid("category")}>Category</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={fid("category")} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="amount"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={fid("amount")}>Amount (৳)</FieldLabel>
              <Input
                id={fid("amount")}
                type="number"
                min={0}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Field>
          <FieldLabel htmlFor={fid("note")}>Note</FieldLabel>
          <Input
            id={fid("note")}
            placeholder="e.g. Eid campaign boost"
            {...form.register("note")}
          />
        </Field>
        <Button type="submit" disabled={add.isPending}>
          <Plus /> Add
        </Button>
      </form>

      <div className="mb-3 flex items-center justify-between">
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
          <SelectTrigger className="w-40" aria-label="Period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm">
          Total: <strong className="tabular-nums">{formatPrice(data?.total ?? 0)}</strong>
        </p>
      </div>

      {error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : !data ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
      ) : list.length ? (
        <ul className="divide-y rounded-xl border bg-card">
          {list.map((e) => (
            <li key={e.id} className="flex items-center gap-3 p-3 text-sm">
              <span className="w-24 shrink-0 text-muted-foreground">
                {formatDate(e.date)}
              </span>
              <span className="w-32 shrink-0 font-medium">{e.category}</span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {e.note}
              </span>
              <span className="font-semibold tabular-nums">{formatPrice(e.amount)}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete"
                className="hover:text-destructive"
                disabled={remove.isPending}
                onClick={() => remove.mutate(e.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          No expenses in this period
        </p>
      )}
    </div>
  )
}
