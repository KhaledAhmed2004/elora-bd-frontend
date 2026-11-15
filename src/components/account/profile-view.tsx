"use client"

import { useFieldId } from "@/hooks/use-field-id"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { formatPhone } from "@/lib/format"
import { profileSchema } from "@/lib/validations/account"
import { useAuthStore } from "@/store/auth-store"

import { RequireAuth } from "./require-auth"

export function ProfileView() {
  return (
    <RequireAuth>
      <ProfileForm />
    </RequireAuth>
  )
}

function ProfileForm() {
  const fid = useFieldId()
  const user = useAuthStore((s) => s.user)!
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, email: user.email ?? "" },
  })

  const onSubmit = form.handleSubmit((v) => {
    updateProfile({ name: v.name, email: v.email || null })
    form.reset(v)
    toast.success("Profile updated")
  })

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-display text-2xl font-bold">Profile</h1>
      <form
        onSubmit={onSubmit}
        noValidate
        className="space-y-5 rounded-2xl border p-5 md:p-6"
      >
        <Field>
          <FieldLabel htmlFor={fid("phone")}>Mobile Number</FieldLabel>
          <Input id={fid("phone")} value={formatPhone(user.phone)} disabled readOnly />
          <FieldDescription>
            You log in with your mobile number, so it can&apos;t be changed.
          </FieldDescription>
        </Field>
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={fid("name")}>Name</FieldLabel>
              <Input
                {...field}
                id={fid("name")}
                autoComplete="name"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={fid("email")}>
                Email{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </FieldLabel>
              <Input
                {...field}
                id={fid("email")}
                type="email"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Button type="submit" disabled={!form.formState.isDirty}>
          Save Changes
        </Button>
      </form>
    </div>
  )
}
