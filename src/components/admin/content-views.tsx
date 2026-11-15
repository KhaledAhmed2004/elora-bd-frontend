"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useFieldId } from "@/hooks/use-field-id"
import {
  adminActions,
  type AdminBanner,
  type AdminCategory,
  adminQueries,
  useAdminMutation,
  useAdminQuery,
} from "@/lib/admin/queries"
import { isApiStatus } from "@/lib/api"
import { slugify } from "@/lib/format"
import { can, useAdminAuthStore } from "@/store/admin-auth-store"

import { NoAccess } from "./admin-shell"
import { PageHeader, QueryError } from "./admin-ui"

/* ───────────────────────── Banners ───────────────────────── */

const bannerSchema = z.object({
  title: z.string().trim().min(2, "Enter a title").max(80),
  subtitle: z.string().trim().max(160),
  cta: z.string().trim().max(30),
  href: z
    .string()
    .trim()
    .regex(/^(\/|https?:\/\/)/, "Enter a link, e.g. /category/saree"),
  image: z.url("Enter a valid image URL"),
})

const BANNER_KEYS = [["banners"]]

export function BannersView() {
  const role = useAdminAuthStore((s) => s.admin?.role)
  const {
    data: banners,
    error,
    refetch,
  } = useAdminQuery(["banners"], adminQueries.banners, {
    enabled: can.manage(role),
  })
  const [editing, setEditing] = useState<AdminBanner | null | undefined>(undefined)
  const save = useAdminMutation(
    ({ id, body }: { id: string | null; body: Omit<AdminBanner, "id" | "sortOrder"> }) =>
      adminActions.saveBanner(id, body),
    {
      invalidate: BANNER_KEYS,
      shop: ["catalog"],
      success: "Banner saved",
      onSuccess: () => setEditing(undefined),
    }
  )
  const remove = useAdminMutation((id: string) => adminActions.deleteBanner(id), {
    invalidate: BANNER_KEYS,
    shop: ["catalog"],
    success: "Banner deleted",
  })
  const reorder = useAdminMutation((ids: string[]) => adminActions.reorderBanners(ids), {
    invalidate: BANNER_KEYS,
    shop: ["catalog"],
  })

  if (!can.manage(role)) return <NoAccess />
  if (error) return <QueryError error={error} onRetry={() => void refetch()} />
  const list = banners ?? []
  const move = (i: number, dir: -1 | 1) => {
    const ids = list.map((b) => b.id)
    ;[ids[i], ids[i + dir]] = [ids[i + dir], ids[i]]
    reorder.mutate(ids)
  }
  const toBody = (b: AdminBanner) => ({
    title: b.title,
    subtitle: b.subtitle,
    cta: b.cta,
    href: b.href,
    image: b.image,
    active: b.active,
  })

  return (
    <div>
      <PageHeader
        title="Home Banners"
        description="Home page slider — shown top to bottom in this order"
      >
        <Button onClick={() => setEditing(null)}>
          <Plus /> New Banner
        </Button>
      </PageHeader>
      {!banners ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
      ) : (
        <ul className="space-y-3">
          {list.map((b, i) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-3"
            >
              <span className="relative aspect-[21/8] w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-48">
                <Image
                  src={b.image}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 192px, 100vw"
                  unoptimized
                  className="object-cover"
                />
              </span>
              <div className="min-w-0 flex-1 sm:min-w-48">
                <p className="font-semibold">{b.title}</p>
                <p className="line-clamp-1 text-sm text-muted-foreground">{b.subtitle}</p>
                <p className="text-xs text-muted-foreground">
                  {b.cta} → {b.href}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Switch
                  checked={b.active}
                  disabled={save.isPending}
                  onCheckedChange={(active) =>
                    save.mutate({ id: b.id, body: { ...toBody(b), active } })
                  }
                  aria-label={`${b.active ? "Deactivate" : "Activate"} ${b.title}`}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Move up"
                  disabled={i === 0 || reorder.isPending}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Move down"
                  disabled={i === list.length - 1 || reorder.isPending}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${b.title}`}
                  onClick={() => setEditing(b)}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${b.title}`}
                  className="hover:text-destructive"
                  disabled={remove.isPending}
                  onClick={() => {
                    if (window.confirm(`Delete banner "${b.title}"?`)) remove.mutate(b.id)
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={editing !== undefined}
        onOpenChange={(o) => !o && setEditing(undefined)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Banner" : "New Banner"}</DialogTitle>
            <DialogDescription>Wide images (21:8) look best</DialogDescription>
          </DialogHeader>
          {editing !== undefined && (
            <BannerForm
              key={editing?.id ?? "new"}
              banner={editing}
              saving={save.isPending}
              onSave={(v) =>
                save.mutate({
                  id: editing?.id ?? null,
                  body: {
                    title: v.title,
                    subtitle: v.subtitle || null,
                    cta: v.cta || null,
                    href: v.href,
                    image: v.image,
                    active: editing?.active ?? true,
                  },
                })
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BannerForm({
  banner,
  saving,
  onSave,
}: {
  banner: AdminBanner | null
  saving: boolean
  onSave: (v: z.infer<typeof bannerSchema>) => void
}) {
  const fid = useFieldId()
  const form = useForm({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: banner?.title ?? "",
      subtitle: banner?.subtitle ?? "",
      cta: banner?.cta ?? "Buy Now",
      href: banner?.href ?? "/products",
      image: banner?.image ?? "",
    },
  })
  const fields = [
    { name: "title", label: "Title" },
    { name: "subtitle", label: "Subtitle" },
    { name: "cta", label: "Button text" },
    { name: "href", label: "Link" },
    { name: "image", label: "Image URL" },
  ] as const
  return (
    <form noValidate className="space-y-4" onSubmit={form.handleSubmit(onSave)}>
      {fields.map(({ name, label }) => (
        <Controller
          key={name}
          control={form.control}
          name={name}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={fid(name)}>{label}</FieldLabel>
              <Input {...field} id={fid(name)} aria-invalid={fieldState.invalid} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      ))}
      <Button type="submit" className="w-full" disabled={saving}>
        Save
      </Button>
    </form>
  )
}

/* ───────────────────────── Categories ───────────────────────── */

const categorySchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(60),
  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Lowercase letters, numbers and hyphens only (e.g. party-saree)"
    ),
  parentId: z.string(),
  image: z.union([z.url("Enter a valid URL"), z.literal("")]),
  active: z.boolean(),
})

const CATEGORY_KEYS = [["categories"], ["products"]]

export function CategoriesView() {
  const role = useAdminAuthStore((s) => s.admin?.role)
  const canEdit = can.manage(role)
  const {
    data: rows,
    error,
    refetch,
  } = useAdminQuery(["categories"], adminQueries.categories)
  const [editing, setEditing] = useState<AdminCategory | null | undefined>(undefined)
  const remove = useAdminMutation((id: string) => adminActions.deleteCategory(id), {
    invalidate: CATEGORY_KEYS,
    shop: ["catalog"],
    success: "Category deleted",
  })

  if (error) return <QueryError error={error} onRetry={() => void refetch()} />
  const all = rows ?? []
  const parents = all.filter((c) => !c.parentId)
  const childrenOf = (id: string) => all.filter((c) => c.parentId === id)

  return (
    <div>
      <PageHeader
        title="Categories"
        description={`${parents.length} main ${parents.length === 1 ? "category" : "categories"}`}
      >
        {canEdit && (
          <Button onClick={() => setEditing(null)}>
            <Plus /> New Category
          </Button>
        )}
      </PageHeader>
      {!rows ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {parents.map((c) => {
            const kids = childrenOf(c.id)
            return (
              <li key={c.id} className="p-3">
                <div className="flex items-center gap-3">
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                    {c.image && (
                      <Image
                        src={c.image}
                        alt=""
                        fill
                        sizes="40px"
                        unoptimized
                        className="object-cover"
                      />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {c.name}
                      {!c.active && (
                        <span className="ml-2 rounded bg-zinc-200 px-1.5 py-0.5 text-xs">
                          Hidden
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      /{c.slug} · {c.productCount}{" "}
                      {c.productCount === 1 ? "product" : "products"}
                    </p>
                  </div>
                  {canEdit && (
                    <CategoryActions
                      category={c}
                      canDelete={c.productCount === 0 && kids.length === 0}
                      deleting={remove.isPending}
                      onEdit={() => setEditing(c)}
                      onDelete={() => remove.mutate(c.id)}
                    />
                  )}
                </div>
                {kids.length > 0 && (
                  <ul className="mt-2 ml-12 flex flex-wrap gap-2">
                    {kids.map((sub) => (
                      <li
                        key={sub.id}
                        className="flex items-center gap-1 rounded-full border py-0.5 pr-1 pl-3 text-sm"
                      >
                        {sub.name}
                        <span className="text-xs text-muted-foreground">
                          ({sub.productCount})
                        </span>
                        {canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`Edit ${sub.name}`}
                              onClick={() => setEditing(sub)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`Delete ${sub.name}`}
                              className="hover:text-destructive"
                              disabled={sub.productCount > 0 || remove.isPending}
                              onClick={() => remove.mutate(sub.id)}
                            >
                              <Trash2 />
                            </Button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Dialog
        open={editing !== undefined}
        onOpenChange={(o) => !o && setEditing(undefined)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle>
            <DialogDescription>
              To create a sub-category, choose a &ldquo;Parent&rdquo;
            </DialogDescription>
          </DialogHeader>
          {editing !== undefined && (
            <CategoryForm
              key={editing?.id ?? "new"}
              category={editing}
              parents={parents}
              hasChildren={editing ? childrenOf(editing.id).length > 0 : false}
              onDone={() => setEditing(undefined)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CategoryActions({
  category,
  canDelete,
  deleting,
  onEdit,
  onDelete,
}: {
  category: AdminCategory
  canDelete: boolean
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Edit ${category.name}`}
        onClick={onEdit}
      >
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${category.name}`}
        title={canDelete ? "Delete" : "Can't delete: it has products or sub-categories"}
        disabled={!canDelete || deleting}
        className="hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 />
      </Button>
    </div>
  )
}

function CategoryForm({
  category,
  parents,
  hasChildren,
  onDone,
}: {
  category: AdminCategory | null
  parents: AdminCategory[]
  hasChildren: boolean
  onDone: () => void
}) {
  const fid = useFieldId()
  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      parentId: category?.parentId ?? "none",
      image: category?.image ?? "",
      active: category?.active ?? true,
    },
  })
  const save = useAdminMutation(
    (v: z.infer<typeof categorySchema>) =>
      adminActions.saveCategory(category?.id ?? null, {
        name: v.name,
        slug: v.slug,
        image: v.image || null,
        parentId: v.parentId === "none" ? null : v.parentId,
        sortOrder: category?.sortOrder ?? 0,
        active: v.active,
      }),
    {
      invalidate: CATEGORY_KEYS,
      shop: ["catalog"],
      success: "Category saved",
      onSuccess: onDone,
    }
  )

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit((v) =>
        save.mutate(v, {
          onError: (e) => {
            if (isApiStatus(e, 409))
              form.setError("slug", { message: "This slug already exists" })
          },
        })
      )}
    >
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={fid("name")}>Name</FieldLabel>
            <Input
              {...field}
              id={fid("name")}
              aria-invalid={fieldState.invalid}
              onChange={(e) => {
                field.onChange(e)
                if (!category && !form.getFieldState("slug").isDirty)
                  form.setValue("slug", slugify(e.target.value))
              }}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="slug"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={fid("slug")}>Slug</FieldLabel>
            <Input {...field} id={fid("slug")} aria-invalid={fieldState.invalid} />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="parentId"
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor={fid("parentId")}>Parent</FieldLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={hasChildren}
            >
              <SelectTrigger id={fid("parentId")} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent (main category)</SelectItem>
                {parents
                  .filter((p) => p.id !== category?.id)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="image"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={fid("image")}>Image URL (optional)</FieldLabel>
            <Input {...field} id={fid("image")} aria-invalid={fieldState.invalid} />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="active"
        render={({ field }) => (
          <label className="flex items-center justify-between gap-3 text-sm">
            Show in the shop menu
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </label>
        )}
      />
      <Button type="submit" className="w-full" disabled={save.isPending}>
        Save
      </Button>
    </form>
  )
}
