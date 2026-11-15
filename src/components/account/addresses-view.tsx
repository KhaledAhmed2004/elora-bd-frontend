"use client"

import { useFieldId } from "@/hooks/use-field-id"
import { zodResolver } from "@hookform/resolvers/zod"
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { LocationFields } from "@/components/shared/location-fields"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatPhone } from "@/lib/format"
import { addressSchema } from "@/lib/validations/account"
import { useAuthStore, type SavedAddress } from "@/store/auth-store"

import { RequireAuth } from "./require-auth"

export function AddressesView() {
  return (
    <RequireAuth>
      <AddressBook />
    </RequireAuth>
  )
}

function AddressBook() {
  const addresses = useAuthStore((s) => s.addresses)
  const removeAddress = useAuthStore((s) => s.removeAddress)
  const setDefaultAddress = useAuthStore((s) => s.setDefaultAddress)
  // undefined = closed, null = new address, object = editing
  const [editing, setEditing] = useState<SavedAddress | null | undefined>(undefined)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Address Book</h1>
        <Button onClick={() => setEditing(null)}>
          <Plus /> New Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
          <MapPin className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Saved addresses are auto-filled at checkout
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-col rounded-xl border p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-semibold">{a.label}</span>
                {a.isDefault && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-primary">
                    Default
                  </span>
                )}
              </div>
              <p className="flex-1 text-sm text-muted-foreground">
                {a.fullName} · {formatPhone(a.phone)}
                <br />
                {a.address}, {a.upazila}, {a.district}, {a.division}
              </p>
              <div className="mt-4 flex items-center gap-1 border-t pt-3">
                <Button variant="ghost" size="sm" onClick={() => setEditing(a)}>
                  <Pencil /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:text-destructive"
                  onClick={() => {
                    removeAddress(a.id)
                    toast.success("Address deleted")
                  }}
                >
                  <Trash2 /> Delete
                </Button>
                {!a.isDefault && (
                  <Button
                    variant="link"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setDefaultAddress(a.id)}
                  >
                    Set as Default
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={editing !== undefined}
        onOpenChange={(o) => !o && setEditing(undefined)}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Address" : "New Address"}</DialogTitle>
            <DialogDescription>Enter your full address for delivery</DialogDescription>
          </DialogHeader>
          {editing !== undefined && (
            <AddressForm
              key={editing?.id ?? "new"}
              initial={editing}
              onSaved={() => setEditing(undefined)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddressForm({
  initial,
  onSaved,
}: {
  initial: SavedAddress | null
  onSaved: () => void
}) {
  const fid = useFieldId()
  const user = useAuthStore((s) => s.user)!
  const saveAddress = useAuthStore((s) => s.saveAddress)

  const form = useForm({
    resolver: zodResolver(addressSchema),
    mode: "onTouched",
    defaultValues: {
      label: initial?.label ?? "Home",
      fullName: initial?.fullName ?? user.name,
      phone: initial?.phone ?? user.phone,
      division: initial?.division ?? "",
      district: initial?.district ?? "",
      upazila: initial?.upazila ?? "",
      address: initial?.address ?? "",
      isDefault: initial?.isDefault ?? false,
    },
  })
  const [division, district, upazila] = useWatch({
    control: form.control,
    name: ["division", "district", "upazila"],
  })
  const errors = form.formState.errors

  const onSubmit = form.handleSubmit((v) => {
    saveAddress({ ...v, id: initial?.id })
    toast.success("Address saved")
    onSaved()
  })

  const text = (name: "label" | "fullName" | "phone", label: string, type = "text") => (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={fid(`addr-${name}`)}>{label}</FieldLabel>
          <Input
            {...field}
            id={fid(`addr-${name}`)}
            type={type}
            aria-invalid={fieldState.invalid}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {text("label", "Address Label (Home / Office)")}
        {text("fullName", "Recipient Name")}
        <div className="sm:col-span-2">{text("phone", "Mobile Number", "tel")}</div>
      </div>
      <LocationFields
        idPrefix="addr-"
        values={{ division, district, upazila }}
        errors={{
          division: errors.division?.message,
          district: errors.district?.message,
          upazila: errors.upazila?.message,
        }}
        onChange={(key, value) =>
          form.setValue(key, value, { shouldValidate: value !== "", shouldTouch: true })
        }
        onBlur={(key) => form.trigger(key)}
      />
      <Controller
        control={form.control}
        name="address"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={fid("addr-address")}>Full Address</FieldLabel>
            <Textarea
              {...field}
              id={fid("addr-address")}
              rows={2}
              placeholder="House no., road, area, landmark"
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="isDefault"
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <Checkbox
              id={fid("addr-default")}
              checked={field.value}
              onCheckedChange={(v) => field.onChange(v === true)}
            />
            <Label htmlFor={fid("addr-default")} className="font-normal">
              Set as default address
            </Label>
          </div>
        )}
      />
      <Button type="submit" className="w-full" size="lg">
        Save
      </Button>
    </form>
  )
}
