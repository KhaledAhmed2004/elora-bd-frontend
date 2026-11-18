"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useFieldId } from "@/hooks/use-field-id"
import { adminAuth } from "@/lib/admin/admin-api"
import { getErrorMessage } from "@/lib/api"

/** Pass `children` as the trigger, or control it with `open` / `onOpenChange`. */
export function ChangePasswordDialog({
  children,
  open: openProp,
  onOpenChange,
}: {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const fid = useFieldId()
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = (o: boolean) => {
    setOpenState(o)
    onOpenChange?.(o)
  }
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setCurrent("")
    setNext("")
    setConfirm("")
    setError(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-sm">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            if (next !== confirm) return setError("The new passwords don't match")
            setSaving(true)
            setError(null)
            try {
              await adminAuth.changePassword(current, next)
              toast.success("Password changed. Other devices were signed out.")
              setOpen(false)
              reset()
            } catch (err) {
              setError(getErrorMessage(err))
            } finally {
              setSaving(false)
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>You stay signed in on this device.</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor={fid("current")}>Current password</FieldLabel>
            <Input
              id={fid("current")}
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={fid("next")}>New password</FieldLabel>
            <Input
              id={fid("next")}
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
            />
            <FieldDescription>
              At least 10 characters, with a letter and a number
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor={fid("confirm")}>Repeat new password</FieldLabel>
            <Input
              id={fid("confirm")}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </Field>
          {error && <FieldError errors={[{ message: error }]} />}
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              Save password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
