"use client"

import { useFieldId } from "@/hooks/use-field-id"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2, Smartphone } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useHydrated } from "@/hooks/use-hydrated"
import { MOCK_OTP, OTP_RESEND_SECONDS, requestOtp, verifyOtp } from "@/lib/auth"
import { formatPhone } from "@/lib/format"
import { cn } from "@/lib/utils"
import { profileSchema } from "@/lib/validations/account"
import { phoneLoginSchema } from "@/lib/validations/auth"
import { otpSchema } from "@/lib/validations/common"
import { useAuthStore } from "@/store/auth-store"
import type { User } from "@/types"

type Step =
  { kind: "phone" } | { kind: "otp"; phone: string } | { kind: "name"; user: User }

/** Only allow same-site relative redirects */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account"
}

/** Uses useSearchParams → render inside <Suspense>. */
export function LoginView({ className }: { className?: string }) {
  const router = useRouter()
  const next = safeNext(useSearchParams().get("next"))
  const hydrated = useHydrated()
  const loggedIn = useAuthStore((s) => Boolean(s.user?.name))
  const login = useAuthStore((s) => s.login)
  const [step, setStep] = useState<Step>({ kind: "phone" })

  // Already logged in → go where they wanted
  useEffect(() => {
    if (hydrated && loggedIn) router.replace(next)
  }, [hydrated, loggedIn, next, router])

  function finish(user: User) {
    login(user)
    toast.success(`Welcome, ${user.name.split(" ")[0]}!`)
    router.replace(next)
  }

  return (
    <div
      className={cn("mx-auto w-full max-w-md rounded-2xl border p-6 md:p-8", className)}
    >
      {step.kind === "phone" && (
        <PhoneStep onSent={(phone) => setStep({ kind: "otp", phone })} />
      )}
      {step.kind === "otp" && (
        <OtpStep
          phone={step.phone}
          onBack={() => setStep({ kind: "phone" })}
          onVerified={(user) =>
            user.name ? finish(user) : setStep({ kind: "name", user })
          }
        />
      )}
      {step.kind === "name" && (
        <NameStep
          onDone={(name, email) => finish({ ...step.user, name, email: email || null })}
        />
      )}
    </div>
  )
}

function PhoneStep({ onSent }: { onSent: (phone: string) => void }) {
  const fid = useFieldId()
  const form = useForm({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: { phone: "" },
  })
  const onSubmit = form.handleSubmit(async ({ phone }) => {
    await requestOtp(phone)
    toast.success(`OTP sent to ${formatPhone(phone)}`)
    onSent(phone)
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Header
        title="Login / Sign Up"
        text="Enter your mobile number and we'll send you an OTP code. No password needed."
      />
      <Controller
        control={form.control}
        name="phone"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={fid("phone")}>Mobile Number</FieldLabel>
            <Input
              {...field}
              id={fid("phone")}
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              autoFocus
              placeholder="01XXXXXXXXX"
              className="h-11 text-base"
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Button
        type="submit"
        size="lg"
        className="h-11 w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
        Send OTP
      </Button>
    </form>
  )
}

function OtpStep({
  phone,
  onBack,
  onVerified,
}: {
  phone: string
  onBack: () => void
  onVerified: (user: User) => void
}) {
  const fid = useFieldId()
  const [seconds, setSeconds] = useState(OTP_RESEND_SECONDS)
  const form = useForm({
    resolver: zodResolver(z.object({ otp: otpSchema })),
    defaultValues: { otp: "" },
  })

  useEffect(() => {
    if (seconds <= 0) return
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds])

  const onSubmit = form.handleSubmit(async ({ otp }) => {
    try {
      onVerified(await verifyOtp(phone, otp))
    } catch (e) {
      form.setError("otp", { message: (e as Error).message })
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Change Number
      </button>
      <Header
        title="Enter OTP Code"
        text={`We sent a 6-digit code to ${formatPhone(phone)}`}
      />
      <Controller
        control={form.control}
        name="otp"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={fid("otp")}>OTP Code</FieldLabel>
            <Input
              {...field}
              onChange={(e) =>
                field.onChange(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              id={fid("otp")}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              placeholder="● ● ● ● ● ●"
              className="h-12 text-center text-xl tracking-[0.5em]"
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
            <FieldDescription>
              Demo: no SMS is sent, enter <strong>{MOCK_OTP}</strong>
            </FieldDescription>
          </Field>
        )}
      />
      <Button
        type="submit"
        size="lg"
        className="h-11 w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
        Verify
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Didn&apos;t get the code?{" "}
        {seconds > 0 ? (
          <span>Resend in {seconds}s</span>
        ) : (
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={async () => {
              await requestOtp(phone)
              setSeconds(OTP_RESEND_SECONDS)
              toast.success("New OTP sent")
            }}
          >
            Resend
          </button>
        )}
      </p>
    </form>
  )
}

function NameStep({ onDone }: { onDone: (name: string, email: string) => void }) {
  const fid = useFieldId()
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "" },
  })
  const onSubmit = form.handleSubmit((v) => onDone(v.name, v.email ?? ""))

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Header
        title="First time here? Welcome!"
        text="Enter your name to create your account."
      />
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={fid("name")}>Your Name</FieldLabel>
            <Input
              {...field}
              id={fid("name")}
              autoComplete="name"
              autoFocus
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
              Email <span className="font-normal text-muted-foreground">(optional)</span>
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
      <Button type="submit" size="lg" className="h-11 w-full">
        Create Account
      </Button>
    </form>
  )
}

function Header({ title, text }: { title: string; text: string }) {
  return (
    <div className="space-y-2 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent">
        <Smartphone className="size-6 text-primary" />
      </span>
      <h1 className="font-display text-xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
