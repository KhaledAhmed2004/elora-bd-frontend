"use client"

import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { siteConfig } from "@/config/site"
import { useAdminTheme } from "@/hooks/use-admin-theme"
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
  useAdminTheme()
  const fid = useFieldId()
  const router = useRouter()
  const raw = useSearchParams().get("next")
  const next =
    raw?.startsWith("/admin") && !raw.startsWith("/admin/login") ? raw : "/admin"
  const status = useAdminAuthStore((s) => s.status)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-wider text-gold-ink uppercase">
            {siteConfig.name} · Admin panel
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage orders, products and customers.
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
          <div className="relative">
            <Input
              id={fid("password")}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              defaultValue={DEV_LOGIN.password}
              required
              className="bg-background pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Field>
          <Button type="submit" size="lg" disabled={pending || status === "signed-in"}>
            {pending && <Loader2 className="animate-spin" />} Sign in
          </Button>
          <FieldDescription className="text-center">
            Forgot your password? Ask the shop owner to reset it.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
