"use client"

import { KeyRound, Plus, UserCheck, UserX } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
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
  adminActions,
  adminQueries,
  type StaffMember,
  useAdminMutation,
  useAdminQuery,
} from "@/lib/admin/queries"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { type AdminRole, can, useAdminAuthStore } from "@/store/admin-auth-store"

import { NoAccess } from "./admin-shell"
import { PageHeader, QueryError } from "./admin-ui"

const ROLES: { value: AdminRole; label: string; text: string }[] = [
  { value: "STAFF", label: "Staff", text: "Orders, calls, customers, reviews" },
  { value: "MANAGER", label: "Manager", text: "+ products, coupons, purchases, reports" },
  { value: "OWNER", label: "Owner", text: "Everything, including staff and settings" },
]
const PASSWORD_HINT = "At least 10 characters, with a letter and a number"

export function StaffView() {
  const me = useAdminAuthStore((s) => s.admin)
  const allowed = can.own(me?.role)
  const {
    data: staff,
    error,
    refetch,
  } = useAdminQuery(["staff"], adminQueries.staff, {
    enabled: allowed,
  })
  const [adding, setAdding] = useState(false)
  const [resetFor, setResetFor] = useState<StaffMember | null>(null)
  const update = useAdminMutation(
    ({
      id,
      body,
    }: {
      id: string
      body: Parameters<typeof adminActions.updateStaff>[1]
    }) => adminActions.updateStaff(id, body),
    { invalidate: [["staff"]], success: "Saved" }
  )

  if (!allowed) return <NoAccess />
  if (error) return <QueryError error={error} onRetry={() => void refetch()} />

  return (
    <div>
      <PageHeader title="Staff" description="Who can sign in to the admin panel">
        <Button onClick={() => setAdding(true)}>
          <Plus /> Add staff
        </Button>
      </PageHeader>

      <ul className="mb-6 grid gap-3 sm:grid-cols-3">
        {ROLES.map((r) => (
          <li key={r.value} className="rounded-xl border bg-card p-3 text-sm">
            <p className="font-semibold">{r.label}</p>
            <p className="text-xs text-muted-foreground">{r.text}</p>
          </li>
        ))}
      </ul>

      {!staff ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {staff.map((s) => {
            const self = s.id === me?.id
            return (
              <li
                key={s.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 p-4 text-sm",
                  !s.active && "opacity-60"
                )}
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-accent font-semibold text-primary">
                  {s.name.charAt(0)}
                </span>
                <div className="min-w-48 flex-1">
                  <p className="font-medium">
                    {s.name}{" "}
                    {self && <span className="text-xs text-muted-foreground">(you)</span>}
                    {!s.active && (
                      <span className="ml-2 rounded bg-zinc-200 px-1.5 py-0.5 text-xs">
                        Deactivated
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.email} ·{" "}
                    {s.lastLoginAt
                      ? `last sign-in ${formatDate(s.lastLoginAt)}`
                      : "never signed in"}
                  </p>
                </div>
                <Select
                  value={s.role}
                  disabled={self || update.isPending}
                  onValueChange={(role) =>
                    update.mutate({ id: s.id, body: { role: role as AdminRole } })
                  }
                >
                  <SelectTrigger className="w-32" aria-label={`Role of ${s.name}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => setResetFor(s)}>
                  <KeyRound /> Reset password
                </Button>
                {!self && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={update.isPending}
                    onClick={() => {
                      if (
                        s.active &&
                        !window.confirm(
                          `Deactivate ${s.name}? They are signed out immediately.`
                        )
                      )
                        return
                      update.mutate({ id: s.id, body: { active: !s.active } })
                    }}
                  >
                    {s.active ? (
                      <>
                        <UserX /> Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck /> Activate
                      </>
                    )}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add staff</DialogTitle>
            <DialogDescription>
              Share the password with them in person or by phone.
            </DialogDescription>
          </DialogHeader>
          {adding && <AddStaffForm onDone={() => setAdding(false)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resetFor)} onOpenChange={(o) => !o && setResetFor(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset password — {resetFor?.name}</DialogTitle>
            <DialogDescription>
              They are signed out everywhere and use the new password.
            </DialogDescription>
          </DialogHeader>
          {resetFor && (
            <ResetForm
              onSave={(password) =>
                update.mutate(
                  { id: resetFor.id, body: { password } },
                  { onSuccess: () => setResetFor(null) }
                )
              }
              saving={update.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddStaffForm({ onDone }: { onDone: () => void }) {
  const fid = useFieldId()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<AdminRole>("STAFF")
  const [password, setPassword] = useState("")
  const add = useAdminMutation(adminActions.addStaff, {
    invalidate: [["staff"]],
    success: (s) => `${s.name} added`,
    onSuccess: onDone,
  })
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        add.mutate({ name: name.trim(), email: email.trim(), role, password })
      }}
    >
      <Field>
        <FieldLabel htmlFor={fid("name")}>Name</FieldLabel>
        <Input
          id={fid("name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={fid("email")}>Email (used to sign in)</FieldLabel>
        <Input
          id={fid("email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={fid("role")}>Role</FieldLabel>
        <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
          <SelectTrigger id={fid("role")} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label} — {r.text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor={fid("password")}>Password</FieldLabel>
        <Input
          id={fid("password")}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <FieldDescription>{PASSWORD_HINT}</FieldDescription>
      </Field>
      <Button type="submit" className="w-full" disabled={add.isPending}>
        Add staff
      </Button>
    </form>
  )
}

function ResetForm({
  onSave,
  saving,
}: {
  onSave: (password: string) => void
  saving: boolean
}) {
  const fid = useFieldId()
  const [password, setPassword] = useState("")
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(password)
      }}
    >
      <Field>
        <FieldLabel htmlFor={fid("pw")}>New password</FieldLabel>
        <Input
          id={fid("pw")}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <FieldDescription>{PASSWORD_HINT}</FieldDescription>
      </Field>
      <Button type="submit" className="w-full" disabled={saving}>
        Save password
      </Button>
    </form>
  )
}
