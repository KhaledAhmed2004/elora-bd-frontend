"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  ChevronsDownUp,
  ExternalLink,
  FolderPlus,
  FolderTree,
  ListFilter,
  ListTree,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"
import Image from "next/image"
import { Fragment, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { cn } from "@/lib/utils"
import { can, useAdminAuthStore } from "@/store/admin-auth-store"

import { NoAccess } from "./admin-shell"
import { FilterTabs, PageHeader, QueryError } from "./admin-ui"

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
    isFetching,
  } = useAdminQuery(["banners"], adminQueries.banners, {
    enabled: can.manage(role),
  })
  const [editing, setEditing] = useState<AdminBanner | null | undefined>(undefined)
  const [toDelete, setToDelete] = useState<AdminBanner | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

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
    onSuccess: () => setToDelete(null),
  })
  const reorder = useAdminMutation((ids: string[]) => adminActions.reorderBanners(ids), {
    invalidate: BANNER_KEYS,
    shop: ["catalog"],
  })

  const list = useMemo(() => banners ?? [], [banners])

  const filteredList = useMemo(() => {
    let result = list

    if (search.trim()) {
      const term = search.trim().toLowerCase()
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(term) ||
          (b.subtitle && b.subtitle.toLowerCase().includes(term)) ||
          (b.cta && b.cta.toLowerCase().includes(term)) ||
          (b.href && b.href.toLowerCase().includes(term))
      )
    }

    if (statusFilter === "active") {
      result = result.filter((b) => b.active)
    } else if (statusFilter === "inactive") {
      result = result.filter((b) => !b.active)
    }

    return result
  }, [list, search, statusFilter])

  if (!can.manage(role)) return <NoAccess />
  if (error) return <QueryError error={error} onRetry={() => void refetch()} />

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
        description={`${list.length} ${list.length === 1 ? "banner" : "banners"} · Displayed top to bottom in this order`}
      >
        <Button onClick={() => setEditing(null)}>
          <Plus /> New Banner
        </Button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full min-w-0 sm:max-w-sm sm:min-w-60">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, subtitle, or link..."
            className="pl-9"
            aria-label="Search banners"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Status filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active only</SelectItem>
            <SelectItem value="inactive">Inactive only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table view */}
      <div
        className={cn(
          "overflow-hidden admin-card",
          (isFetching || reorder.isPending) && "opacity-70 transition-opacity"
        )}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="w-24 pl-4">Order</TableHead>
                <TableHead className="min-w-64">Banner</TableHead>
                <TableHead>Call to Action & Link</TableHead>
                <TableHead className="w-40">Status</TableHead>
                <TableHead className="w-28 pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    {banners ? "No banners found" : "Loading banners..."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((b) => {
                  const originalIndex = list.findIndex((item) => item.id === b.id)
                  const canMoveUp =
                    originalIndex > 0 && !search.trim() && statusFilter === "all"
                  const canMoveDown =
                    originalIndex < list.length - 1 &&
                    !search.trim() &&
                    statusFilter === "all"

                  return (
                    <TableRow
                      key={b.id}
                      className="group transition-colors hover:bg-muted/40"
                    >
                      {/* Order column */}
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-center font-mono text-xs font-semibold text-muted-foreground tabular-nums">
                            #{originalIndex + 1}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Move up"
                              disabled={!canMoveUp || reorder.isPending}
                              onClick={() => move(originalIndex, -1)}
                              className="size-5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                              <ArrowUp className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Move down"
                              disabled={!canMoveDown || reorder.isPending}
                              onClick={() => move(originalIndex, 1)}
                              className="size-5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                              <ArrowDown className="size-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>

                      {/* Banner Image & Title */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="relative aspect-[21/8] w-28 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border/50 sm:w-36">
                            <Image
                              src={b.image}
                              alt={b.title}
                              fill
                              sizes="144px"
                              unoptimized
                              className="object-cover"
                            />
                          </span>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setEditing(b)}
                              className="block cursor-pointer truncate text-left text-sm font-semibold text-foreground transition-colors hover:text-primary"
                            >
                              {b.title}
                            </button>
                            {b.subtitle && (
                              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                {b.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* CTA & Link */}
                      <TableCell>
                        <div className="flex max-w-sm items-center gap-2">
                          {b.cta && (
                            <span className="shrink-0 rounded bg-accent/80 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                              {b.cta}
                            </span>
                          )}
                          <a
                            href={b.href ?? "#"}
                            target={b.href?.startsWith("http") ? "_blank" : undefined}
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 truncate font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
                          >
                            <span className="truncate">{b.href ?? "—"}</span>
                            <ExternalLink className="size-3 shrink-0" />
                          </a>
                        </div>
                      </TableCell>

                      {/* Status switch */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={b.active}
                            disabled={save.isPending}
                            onCheckedChange={(active) =>
                              save.mutate({ id: b.id, body: { ...toBody(b), active } })
                            }
                            aria-label={`${b.active ? "Deactivate" : "Activate"} ${b.title}`}
                          />
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              b.active
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                                : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                            )}
                          >
                            {b.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${b.title}`}
                            onClick={() => setEditing(b)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${b.title}`}
                            className="text-muted-foreground hover:text-destructive"
                            disabled={remove.isPending}
                            onClick={() => setToDelete(b)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete confirmation alert dialog */}
      <AlertDialog open={Boolean(toDelete)} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete banner?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete banner &ldquo;{toDelete?.title}&rdquo;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (toDelete) {
                  remove.mutate(toDelete.id, {
                    onSuccess: () => setToDelete(null),
                  })
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit / New Banner Modal */}
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

type CategoryTab = "all" | "parents" | "subs" | "active" | "hidden"

export function CategoriesView() {
  const role = useAdminAuthStore((s) => s.admin?.role)
  const canEdit = can.manage(role)
  const {
    data: rows,
    error,
    refetch,
    isFetching,
  } = useAdminQuery(["categories"], adminQueries.categories)
  const [editing, setEditing] = useState<AdminCategory | null | undefined>(undefined)
  const [parentForNewSub, setParentForNewSub] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<AdminCategory | null>(null)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<CategoryTab>("all")
  const [viewMode, setViewMode] = useState<"tree" | "flat">("tree")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const remove = useAdminMutation((id: string) => adminActions.deleteCategory(id), {
    invalidate: CATEGORY_KEYS,
    shop: ["catalog"],
    success: "Category deleted",
    onSuccess: () => setToDelete(null),
  })

  const all = useMemo(() => rows ?? [], [rows])
  const parents = useMemo(() => all.filter((c) => !c.parentId), [all])
  const childrenMap = useMemo(() => {
    const map = new Map<string, AdminCategory[]>()
    for (const c of all) {
      if (c.parentId) {
        const list = map.get(c.parentId) ?? []
        list.push(c)
        map.set(c.parentId, list)
      }
    }
    return map
  }, [all])

  const parentMap = useMemo(() => {
    const map = new Map<string, AdminCategory>()
    for (const p of parents) {
      map.set(p.id, p)
    }
    return map
  }, [parents])

  const childrenOf = (id: string) => childrenMap.get(id) ?? []

  // Top metric calculations
  const totalAssignedProducts = useMemo(
    () => all.reduce((sum, c) => sum + c.productCount, 0),
    [all]
  )
  const activeCount = useMemo(() => all.filter((c) => c.active).length, [all])
  const hiddenCount = useMemo(() => all.filter((c) => !c.active).length, [all])
  const subCount = all.length - parents.length

  const filterTabs = useMemo(
    () => [
      { value: "all" as const, label: "All", count: all.length },
      { value: "parents" as const, label: "Main Categories", count: parents.length },
      { value: "subs" as const, label: "Subcategories", count: subCount },
      { value: "active" as const, label: "Active", count: activeCount },
      { value: "hidden" as const, label: "Hidden", count: hiddenCount },
    ],
    [all.length, parents.length, subCount, activeCount, hiddenCount]
  )

  // Auto-expand parents during search without triggering extra renders
  const effectiveExpandedIds = useMemo(() => {
    if (!search.trim()) return expandedIds
    const term = search.trim().toLowerCase()
    const auto = new Set(expandedIds)
    for (const p of parents) {
      const kids = childrenMap.get(p.id) ?? []
      if (
        kids.some(
          (k) =>
            k.name.toLowerCase().includes(term) || k.slug.toLowerCase().includes(term)
        )
      ) {
        auto.add(p.id)
      }
    }
    return auto
  }, [search, expandedIds, parents, childrenMap])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => setExpandedIds(new Set(parents.map((p) => p.id)))
  const collapseAll = () => setExpandedIds(new Set())

  // In tree mode, filter parents
  const visibleParents = useMemo(() => {
    let list = parents
    const term = search.trim().toLowerCase()

    if (activeTab === "active") {
      list = list.filter((p) => p.active)
    } else if (activeTab === "hidden") {
      list = list.filter((p) => !p.active)
    }

    if (term) {
      list = list.filter((p) => {
        const matchSelf =
          p.name.toLowerCase().includes(term) || p.slug.toLowerCase().includes(term)
        const kids = childrenMap.get(p.id) ?? []
        const matchKids = kids.some(
          (k) =>
            k.name.toLowerCase().includes(term) || k.slug.toLowerCase().includes(term)
        )
        return matchSelf || matchKids
      })
    }

    return list
  }, [parents, search, activeTab, childrenMap])

  // In flat mode, or when filtering by 'subs'
  const visibleFlatCategories = useMemo(() => {
    let list = all
    const term = search.trim().toLowerCase()

    if (activeTab === "parents") {
      list = list.filter((c) => !c.parentId)
    } else if (activeTab === "subs") {
      list = list.filter((c) => Boolean(c.parentId))
    } else if (activeTab === "active") {
      list = list.filter((c) => c.active)
    } else if (activeTab === "hidden") {
      list = list.filter((c) => !c.active)
    }

    if (term) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.slug.toLowerCase().includes(term) ||
          (c.parentId && parentMap.get(c.parentId)?.name.toLowerCase().includes(term))
      )
    }

    return list
  }, [all, activeTab, search, parentMap])

  const isTree = viewMode === "tree" && activeTab !== "subs"

  if (error) return <QueryError error={error} onRetry={() => void refetch()} />

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize your shop catalog taxonomy, categories and subcategories"
      >
        {canEdit && (
          <Button
            onClick={() => {
              setParentForNewSub(null)
              setEditing(null)
            }}
            className="gap-1.5 shadow-xs"
          >
            <Plus className="size-4" /> New category
          </Button>
        )}
      </PageHeader>

      {/* KPI Metric Overview Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Categories</span>
            <FolderTree className="size-4 text-primary" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {all.length}
            </span>
            <span className="text-xs text-muted-foreground">in catalog</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Main Categories</span>
            <FolderPlus className="size-4 text-sky-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {parents.length}
            </span>
            <span className="text-xs text-muted-foreground">top-level</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Subcategories</span>
            <ListTree className="size-4 text-indigo-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {subCount}
            </span>
            <span className="text-xs text-muted-foreground">sub-levels</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Linked Products</span>
            <Package className="size-4 text-emerald-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {totalAssignedProducts}
            </span>
            <span className="text-xs text-muted-foreground">products</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <FilterTabs
        tabs={filterTabs}
        value={activeTab}
        onChange={(t) => setActiveTab(t as CategoryTab)}
        label="Category Filter"
      />

      {/* Search & View Controls Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm min-w-56 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search category name or slug..."
            className="h-9 pr-8 pl-9 text-xs sm:text-sm"
            aria-label="Search categories"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Tree / Flat View Mode Switcher */}
          {activeTab !== "subs" && (
            <div className="flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("tree")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  viewMode === "tree"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Hierarchy tree view"
              >
                <ListTree className="size-3.5" />
                <span className="hidden sm:inline">Tree</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("flat")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  viewMode === "flat"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Flat table view"
              >
                <ListFilter className="size-3.5" />
                <span className="hidden sm:inline">Flat</span>
              </button>
            </div>
          )}

          {/* Expand / Collapse All (Tree mode only) */}
          {isTree && (
            <Button
              variant="outline"
              size="sm"
              onClick={effectiveExpandedIds.size > 0 ? collapseAll : expandAll}
              className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronsDownUp className="size-3.5" />
              <span>{effectiveExpandedIds.size > 0 ? "Collapse all" : "Expand all"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Unified Clean Table */}
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border/70 bg-card shadow-2xs",
          isFetching && "opacity-70 transition-opacity"
        )}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[38%] min-w-[260px] pl-4">Category</TableHead>
                <TableHead className="w-[20%] min-w-[150px]">
                  Hierarchy / Parent
                </TableHead>
                <TableHead className="w-[18%] min-w-[130px]">Products</TableHead>
                <TableHead className="w-[12%] min-w-[100px]">Visibility</TableHead>
                <TableHead className="w-[12%] min-w-[110px] pr-4 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTree ? (
                /* Tree View Rendering */
                visibleParents.length === 0 ? (
                  <EmptyCategoryRow search={search} onClear={() => setSearch("")} />
                ) : (
                  visibleParents.map((p) => {
                    const kids = childrenMap.get(p.id) ?? []
                    const isExpanded = effectiveExpandedIds.has(p.id)
                    const canDeleteParent = p.productCount === 0 && kids.length === 0
                    const totalProducts =
                      p.productCount + kids.reduce((sum, k) => sum + k.productCount, 0)

                    return (
                      <Fragment key={p.id}>
                        {/* Parent Row */}
                        <TableRow
                          className={cn(
                            "group transition-colors",
                            isExpanded ? "bg-muted/20" : "hover:bg-muted/30"
                          )}
                        >
                          {/* Category Name & Image */}
                          <TableCell className="py-3 pl-4">
                            <div className="flex items-center gap-2.5">
                              {kids.length > 0 ? (
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => toggleExpand(p.id)}
                                  className="size-7 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                                  aria-label={isExpanded ? "Collapse" : "Expand"}
                                >
                                  <ChevronRight
                                    className={cn(
                                      "size-4 transition-transform duration-200",
                                      isExpanded && "rotate-90 font-bold text-primary"
                                    )}
                                  />
                                </Button>
                              ) : (
                                <span className="size-7 shrink-0" />
                              )}

                              <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border/50">
                                {p.image ? (
                                  <Image
                                    src={p.image}
                                    alt={p.name}
                                    fill
                                    sizes="40px"
                                    unoptimized
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-muted/60 text-muted-foreground">
                                    <FolderTree className="size-4" />
                                  </div>
                                )}
                              </span>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditing(p)}
                                    className="cursor-pointer truncate text-left text-sm font-semibold text-foreground transition-colors hover:text-primary hover:underline"
                                  >
                                    {p.name}
                                  </button>
                                  {kids.length > 0 && (
                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                      {kids.length} {kids.length === 1 ? "sub" : "subs"}
                                    </span>
                                  )}
                                </div>
                                <p className="font-mono text-xs text-muted-foreground">
                                  /{p.slug}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Hierarchy / Level */}
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/80 px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                              <FolderTree className="size-3 text-muted-foreground" />
                              Main Category
                            </span>
                          </TableCell>

                          {/* Products */}
                          <TableCell className="tabular-nums">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {totalProducts}{" "}
                                {totalProducts === 1 ? "product" : "products"}
                              </span>
                              {kids.length > 0 && p.productCount !== totalProducts && (
                                <span className="text-[11px] text-muted-foreground">
                                  {p.productCount} direct ·{" "}
                                  {totalProducts - p.productCount} in subs
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Visibility */}
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                                p.active
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400"
                              )}
                            >
                              <span
                                className={cn(
                                  "size-1.5 rounded-full",
                                  p.active ? "bg-emerald-500" : "bg-zinc-400"
                                )}
                              />
                              {p.active ? "Active" : "Hidden"}
                            </span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="pr-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {canEdit && (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() => {
                                    setParentForNewSub(p.id)
                                    setEditing(null)
                                  }}
                                  className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
                                  title={`Add subcategory to ${p.name}`}
                                >
                                  <FolderPlus className="size-3.5" />
                                  <span className="hidden md:inline">+ Sub</span>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Edit ${p.name}`}
                                onClick={() => setEditing(p)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Delete ${p.name}`}
                                  title={
                                    canDeleteParent
                                      ? "Delete"
                                      : "Can't delete: it has products or subcategories"
                                  }
                                  disabled={!canDeleteParent || remove.isPending}
                                  className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                                  onClick={() => setToDelete(p)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Indented Subcategories Rows (Unified Table Columns) */}
                        {isExpanded &&
                          kids.map((sub) => {
                            const canDeleteSub = sub.productCount === 0
                            return (
                              <TableRow
                                key={sub.id}
                                className="border-border/40 bg-muted/15 transition-colors hover:bg-muted/30"
                              >
                                {/* Category Info with Tree Connector */}
                                <TableCell className="py-2.5 pl-8 sm:pl-11">
                                  <div className="flex items-center gap-2.5">
                                    <span className="font-mono text-sm text-muted-foreground/60 select-none">
                                      ↳
                                    </span>
                                    <span className="relative size-8 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border/40">
                                      {sub.image ? (
                                        <Image
                                          src={sub.image}
                                          alt={sub.name}
                                          fill
                                          sizes="32px"
                                          unoptimized
                                          className="object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-muted/60 text-muted-foreground">
                                          <FolderTree className="size-3.5" />
                                        </div>
                                      )}
                                    </span>
                                    <div className="min-w-0">
                                      <button
                                        type="button"
                                        onClick={() => setEditing(sub)}
                                        className="cursor-pointer truncate text-left text-xs font-medium text-foreground transition-colors hover:text-primary hover:underline"
                                      >
                                        {sub.name}
                                      </button>
                                      <p className="font-mono text-[11px] text-muted-foreground">
                                        /{sub.slug}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Hierarchy / Parent */}
                                <TableCell>
                                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <span className="text-[11px] text-muted-foreground/70">
                                      under
                                    </span>
                                    <span className="font-medium text-foreground">
                                      {p.name}
                                    </span>
                                  </span>
                                </TableCell>

                                {/* Products */}
                                <TableCell className="text-xs tabular-nums">
                                  <span className="font-medium text-foreground">
                                    {sub.productCount}
                                  </span>{" "}
                                  <span className="text-muted-foreground">
                                    {sub.productCount === 1 ? "product" : "products"}
                                  </span>
                                </TableCell>

                                {/* Visibility */}
                                <TableCell>
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                                      sub.active
                                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-400"
                                        : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400"
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "size-1.5 rounded-full",
                                        sub.active ? "bg-emerald-500" : "bg-zinc-400"
                                      )}
                                    />
                                    {sub.active ? "Active" : "Hidden"}
                                  </span>
                                </TableCell>

                                {/* Actions */}
                                <TableCell className="pr-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      aria-label={`Edit ${sub.name}`}
                                      onClick={() => setEditing(sub)}
                                      className="text-muted-foreground hover:text-foreground"
                                    >
                                      <Pencil className="size-3.5" />
                                    </Button>
                                    {canEdit && (
                                      <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        aria-label={`Delete ${sub.name}`}
                                        disabled={!canDeleteSub || remove.isPending}
                                        title={
                                          !canDeleteSub
                                            ? "Cannot delete subcategory with products"
                                            : "Delete"
                                        }
                                        className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                                        onClick={() => setToDelete(sub)}
                                      >
                                        <Trash2 className="size-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}

                        {/* Quick Add Subcategory footer row for expanded parent */}
                        {isExpanded && canEdit && (
                          <TableRow className="border-border/40 bg-muted/5 hover:bg-muted/10">
                            <TableCell colSpan={5} className="py-2 pl-12 sm:pl-16">
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => {
                                  setParentForNewSub(p.id)
                                  setEditing(null)
                                }}
                                className="h-7 gap-1.5 text-xs text-primary hover:text-primary/80"
                              >
                                <Plus className="size-3.5" /> Add subcategory to {p.name}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    )
                  })
                )
              ) : /* Flat View Rendering */
              visibleFlatCategories.length === 0 ? (
                <EmptyCategoryRow search={search} onClear={() => setSearch("")} />
              ) : (
                visibleFlatCategories.map((c) => {
                  const isParent = !c.parentId
                  const parentCategory = c.parentId ? parentMap.get(c.parentId) : null
                  const kids = isParent ? (childrenMap.get(c.id) ?? []) : []
                  const canDelete =
                    c.productCount === 0 && (!isParent || kids.length === 0)

                  return (
                    <TableRow key={c.id} className="transition-colors hover:bg-muted/30">
                      {/* Category */}
                      <TableCell className="py-3 pl-4">
                        <div className="flex items-center gap-3">
                          <span className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border/50">
                            {c.image ? (
                              <Image
                                src={c.image}
                                alt={c.name}
                                fill
                                sizes="36px"
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-muted/60 text-muted-foreground">
                                <FolderTree className="size-4" />
                              </div>
                            )}
                          </span>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setEditing(c)}
                              className="cursor-pointer truncate text-left text-sm font-semibold text-foreground transition-colors hover:text-primary hover:underline"
                            >
                              {c.name}
                            </button>
                            <p className="font-mono text-xs text-muted-foreground">
                              /{c.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Hierarchy */}
                      <TableCell>
                        {isParent ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/80 px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                            <FolderTree className="size-3 text-muted-foreground" />
                            Main Category
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <span className="text-[11px] text-muted-foreground/70">
                              under
                            </span>
                            <span className="font-medium text-foreground">
                              {parentCategory?.name ?? "Main"}
                            </span>
                          </span>
                        )}
                      </TableCell>

                      {/* Products */}
                      <TableCell className="text-sm font-medium tabular-nums">
                        {c.productCount}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          {c.productCount === 1 ? "product" : "products"}
                        </span>
                      </TableCell>

                      {/* Visibility */}
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                            c.active
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-400"
                              : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400"
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              c.active ? "bg-emerald-500" : "bg-zinc-400"
                            )}
                          />
                          {c.active ? "Active" : "Hidden"}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isParent && canEdit && (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => {
                                setParentForNewSub(c.id)
                                setEditing(null)
                              }}
                              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
                              title={`Add subcategory to ${c.name}`}
                            >
                              <FolderPlus className="size-3.5" />
                              <span className="hidden md:inline">+ Sub</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${c.name}`}
                            onClick={() => setEditing(c)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Delete ${c.name}`}
                              disabled={!canDelete || remove.isPending}
                              title={
                                !canDelete
                                  ? "Cannot delete: it has products or subcategories"
                                  : "Delete"
                              }
                              className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                              onClick={() => setToDelete(c)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={Boolean(toDelete)} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{toDelete?.name}&rdquo;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (toDelete) {
                  remove.mutate(toDelete.id, {
                    onSuccess: () => setToDelete(null),
                  })
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit / New Category Modal */}
      <Dialog
        open={editing !== undefined}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(undefined)
            setParentForNewSub(null)
          }
        }}
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
              key={editing?.id ?? parentForNewSub ?? "new"}
              category={editing}
              parents={parents}
              defaultParentId={parentForNewSub}
              hasChildren={editing ? childrenOf(editing.id).length > 0 : false}
              onDone={() => {
                setEditing(undefined)
                setParentForNewSub(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmptyCategoryRow({ search, onClear }: { search: string; onClear: () => void }) {
  return (
    <TableRow>
      <TableCell colSpan={5} className="py-16 text-center">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FolderTree className="size-5" />
          </div>
          <p className="text-sm font-medium text-foreground">No categories found</p>
          <p className="text-xs text-muted-foreground">
            {search
              ? "Try adjusting your search query or filter tab"
              : "No categories matching this view"}
          </p>
          {search && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="mt-2 text-xs"
            >
              Clear search
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

function CategoryForm({
  category,
  parents,
  hasChildren,
  defaultParentId,
  onDone,
}: {
  category: AdminCategory | null
  parents: AdminCategory[]
  hasChildren: boolean
  defaultParentId?: string | null
  onDone: () => void
}) {
  const fid = useFieldId()
  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      parentId: category?.parentId ?? defaultParentId ?? "none",
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
