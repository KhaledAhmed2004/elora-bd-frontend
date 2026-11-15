"use client"

import { Ban, Trash2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useFieldId } from "@/hooks/use-field-id"
import {
  adminActions,
  adminQueries,
  useAdminMutation,
  useAdminQuery,
} from "@/lib/admin/queries"
import { formatDate, formatPhone } from "@/lib/format"
import { adminBdPhoneSchema } from "@/lib/validations/common"

import { PageHeader, QueryError } from "./admin-ui"

export function BlacklistView() {
  const fid = useFieldId()
  const {
    data: entries,
    error: loadError,
    refetch,
  } = useAdminQuery(["blacklist"], adminQueries.blacklist)
  const [phone, setPhone] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const add = useAdminMutation(
    (v: { phone: string; reason: string }) => adminActions.blacklist(v.phone, v.reason),
    {
      invalidate: [["blacklist"], ["orders"], ["customers"]],
      success: "Added to blacklist",
      onSuccess: () => {
        setPhone("")
        setReason("")
        setError(null)
      },
    }
  )
  const remove = useAdminMutation((p: string) => adminActions.unblacklist(p), {
    invalidate: [["blacklist"], ["orders"], ["customers"]],
    success: "Removed from blacklist",
  })

  return (
    <div>
      <PageHeader
        title="Blacklist"
        description="Website orders from these numbers will be blocked"
      />
      <form
        className="mb-6 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          const parsed = adminBdPhoneSchema.safeParse(phone)
          if (!parsed.success) return setError(parsed.error.issues[0].message)
          if (reason.trim().length < 2) return setError("Enter a reason")
          add.mutate({ phone: parsed.data, reason: reason.trim() })
        }}
      >
        <Field>
          <FieldLabel htmlFor={fid("phone")}>Mobile Number</FieldLabel>
          <Input
            id={fid("phone")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            placeholder="01XXXXXXXXX"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={fid("reason")}>Reason</FieldLabel>
          <Input
            id={fid("reason")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="E.g. repeatedly orders but refuses delivery"
          />
        </Field>
        <Button type="submit" variant="destructive" disabled={add.isPending}>
          <Ban /> Add
        </Button>
        {error && <FieldError className="sm:col-span-3" errors={[{ message: error }]} />}
      </form>

      {loadError ? (
        <QueryError error={loadError} onRetry={() => void refetch()} />
      ) : !entries ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          Blacklist is empty
        </p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {entries.map((e) => (
            <li key={e.phone} className="flex items-center gap-3 p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{formatPhone(e.phone)}</p>
                <p className="text-muted-foreground">
                  {e.reason} · {formatDate(e.createdAt)}
                  {e.createdBy && ` · by ${e.createdBy}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={remove.isPending}
                onClick={() => remove.mutate(e.phone)}
              >
                <Trash2 /> Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
