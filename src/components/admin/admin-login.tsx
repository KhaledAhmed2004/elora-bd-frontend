"use client"

import { Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { siteConfig } from "@/config/site"
import { useFieldId } from "@/hooks/use-field-id"
import { adminAuth, refreshSession } from "@/lib/admin/admin-api"
import { getErrorMessage } from "@/lib/api"
import { useAdminAuthStore } from "@/store/admin-auth-store"

// Dev convenience: pre-fill login from .env.local. Dropped from production builds.
const DEV_LOGIN =
  process.env.NODE_ENV === "development"
    ? {
        email: process.env.NEXT_PUBLIC_DEV_ADMIN_EMAIL ?? "",
        password: process.env.NEXT_PUBLIC_DEV_ADMIN_PASSWORD ?? "",
      }
    : { email: "", password: "" }

/** Uses useSearchParams → render inside <Suspense>. */
export function AdminLogin() {
  const fid = useFieldId()
  const router = useRouter()
  const raw = useSearchParams().get("next")
  const next =
    raw?.startsWith("/admin") && !raw.startsWith("/admin/login") ? raw : "/admin"
  const status = useAdminAuthStore((s) => s.status)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  // Already signed in (refresh cookie still valid)? Go straight in.
  useEffect(() => {
    if (status === "checking") void refreshSession()
    if (status === "signed-in") router.replace(next)
  }, [status, next, router])

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={async (e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        setPending(true)
        setError(null)
        try {
          await adminAuth.login(String(data.get("email")), String(data.get("password")))
        } catch (err) {
          setError(getErrorMessage(err))
        } finally {
          setPending(false)
        }
      }}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-heading text-2xl font-bold">{siteConfig.name} Admin</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email below to log in to the admin panel
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor={fid("email")}>Email</FieldLabel>
          <Input
            id={fid("email")}
            name="email"
            type="email"
            placeholder="admin@example.com"
            autoComplete="username"
            defaultValue={DEV_LOGIN.email}
            required
            className="bg-background"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={fid("password")}>Password</FieldLabel>
          <Input
            id={fid("password")}
            name="password"
            type="password"
            autoComplete="current-password"
            defaultValue={DEV_LOGIN.password}
            required
            className="bg-background"
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Field>
          <Button type="submit" disabled={pending || status === "signed-in"}>
            {pending && <Loader2 className="animate-spin" />} Login
          </Button>
          <FieldDescription className="text-center">
            Forgot your password? Ask the shop owner to reset it.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
