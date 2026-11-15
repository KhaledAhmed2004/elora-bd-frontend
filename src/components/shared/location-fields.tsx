"use client"

import { useId } from "react"

import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { divisions, getDistricts, getUpazilas, withBangla } from "@/lib/locations"
import { cn } from "@/lib/utils"

export type LocationKey = "division" | "district" | "upazila"
export type LocationValues = Record<LocationKey, string>

interface LocationFieldsProps {
  values: LocationValues
  errors?: Partial<Record<LocationKey, string | undefined>>
  /** Called for each field that changes; dependent fields are reset to "" */
  onChange: (key: LocationKey, value: string) => void
  onBlur?: (key: LocationKey) => void
  idPrefix?: string
  className?: string
}

/**
 * Division → District → Upazila/Thana cascade. Form-library agnostic:
 * wire it to react-hook-form with useWatch + setValue.
 */
export function LocationFields({
  values,
  errors = {},
  onChange,
  onBlur,
  idPrefix = "",
  className,
}: LocationFieldsProps) {
  // Unique per instance (Next keeps hidden routes mounted — see useFieldId)
  const uid = useId()
  const districts = getDistricts(values.division)
  const upazilas = getUpazilas(values.division, values.district)

  const fields: {
    key: LocationKey
    label: string
    options: { name: string; bn?: string }[]
    disabled: boolean
    placeholder: string
    wide?: boolean
  }[] = [
    {
      key: "division",
      label: "Division *",
      options: divisions,
      disabled: false,
      placeholder: "Select division",
    },
    {
      key: "district",
      label: "District (Zila) *",
      options: districts,
      disabled: !values.division,
      placeholder: values.division
        ? "Select district"
        : "Select a division first",
    },
    {
      key: "upazila",
      label: "Upazila / Thana *",
      options: upazilas,
      disabled: !values.district,
      placeholder: values.district
        ? "Select upazila/thana"
        : "Select a district first",
      wide: true,
    },
  ]

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {fields.map((f) => {
        const id = `${idPrefix}${f.key}-${uid}`
        const error = errors[f.key]
        return (
          <Field
            key={f.key}
            data-invalid={Boolean(error)}
            className={cn(f.wide && "sm:col-span-2")}
          >
            <FieldLabel htmlFor={id}>{f.label}</FieldLabel>
            <Select
              name={f.key}
              value={values[f.key]}
              disabled={f.disabled}
              onValueChange={(v) => {
                onChange(f.key, v)
                if (f.key === "division") {
                  onChange("district", "")
                  onChange("upazila", "")
                } else if (f.key === "district") {
                  onChange("upazila", "")
                }
              }}
            >
              <SelectTrigger
                id={id}
                className="w-full"
                aria-invalid={Boolean(error)}
                onBlur={() => onBlur?.(f.key)}
              >
                <SelectValue placeholder={f.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {f.options.map((o) => (
                  <SelectItem key={o.name} value={o.name}>
                    {withBangla(o)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={error ? [{ message: error }] : undefined} />
          </Field>
        )
      })}
    </div>
  )
}
