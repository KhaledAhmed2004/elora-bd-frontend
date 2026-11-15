"use client"

import { useFieldId } from "@/hooks/use-field-id"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Send } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { bdPhoneSchema } from "@/lib/validations/common"

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  phone: bdPhoneSchema,
  message: z
    .string()
    .trim()
    .min(10, "Please add a bit more detail (at least 10 characters)")
    .max(1000),
})

export function ContactForm() {
  const fid = useFieldId()
  const form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", phone: "", message: "" },
  })

  // MOCK: will POST /contact when the backend exists
  const onSubmit = form.handleSubmit(async () => {
    await new Promise((r) => setTimeout(r, 600))
    toast.success("Message sent! We'll get back to you soon.")
    form.reset()
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={fid("c-name")}>Name</FieldLabel>
              <Input
                {...field}
                id={fid("c-name")}
                autoComplete="name"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="phone"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={fid("c-phone")}>Mobile Number</FieldLabel>
              <Input
                {...field}
                id={fid("c-phone")}
                type="tel"
                inputMode="numeric"
                placeholder="01XXXXXXXXX"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </div>
      <Controller
        control={form.control}
        name="message"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={fid("c-message")}>Message</FieldLabel>
            <Textarea
              {...field}
              id={fid("c-message")}
              rows={5}
              placeholder="Include your order number if you have one"
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
        Send Message
      </Button>
    </form>
  )
}
