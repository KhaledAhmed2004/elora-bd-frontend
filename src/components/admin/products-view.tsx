"use client"

import { Eye, EyeOff, FolderTree, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo, useState } from "react"

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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounced } from "@/hooks/use-debounced"
import {
  adminActions,
  type AdminProduct,
  adminQueries,
  useAdminMutation,
  useAdminQuery,
} from "@/lib/admin/queries"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { can, useAdminAuthStore } from "@/store/admin-auth-store"

import { PageHeader, Pager, QueryError } from "./admin-ui"
import {
  type AdminColumn,
  columnHelper,
  DataTable,
  type RowSelectionState,
} from "./data-table"
import { ProductForm } from "./product-form"

type Product = AdminProduct
const PAGE_SIZE = 20
const variantName = (v: { color: string | null; size: string | null }) =>
  [v.color, v.size].filter(Boolean).join(" / ")

export function ProductsView() {
  const role = useAdminAuthStore((s) => s.admin?.role)
  const canEdit = can.manage(role)
  const { data: categories = [] } = useAdminQuery(["categories"], adminQueries.categories)
  const [search, setSearch] = useState("")
  const q = useDebounced(search.trim(), 350)
  const [category, setCategory] = useState("all")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [selection, setSelection] = useState<RowSelectionState>({})
  const [targetCategory, setTargetCategory] = useState("")
  const [toDelete, setToDelete] = useState<Product | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const selectedIds = useMemo(
    () => Object.keys(selection).filter((id) => selection[id]),
    [selection]
  )

  const filter = {
    q,
    categoryId: category === "all" ? undefined : category,
    status: status === "all" ? undefined : status.toUpperCase(),
  }
  const { data, error, refetch, isFetching } = useAdminQuery(
    ["products", "list", filter, page],
    () => adminQueries.products({ ...filter, page, limit: PAGE_SIZE }),
    { placeholderData: (prev) => prev }
  )
  const remove = useAdminMutation((id: string) => adminActions.deleteProduct(id), {
    invalidate: [["products"], ["dashboard"]],
    success: "Product deleted",
    shop: ["catalog"],
    onSuccess: () => setToDelete(null),
  })

  const bulkStatus = useAdminMutation(
    ({ ids, status }: { ids: string[]; status: "ACTIVE" | "HIDDEN" | "DRAFT" }) =>
      adminActions.bulkProductStatus(ids, status),
    {
      invalidate: [["products"], ["dashboard"]],
      shop: ["catalog"],
      success: "Products updated",
      onSuccess: () => setSelection({}),
    }
  )

  const bulkCategory = useAdminMutation(
    ({ ids, categoryId }: { ids: string[]; categoryId: string }) =>
      adminActions.bulkProductCategory(ids, categoryId),
    {
      invalidate: [["products"], ["categories"]],
      shop: ["catalog"],
      success: "Products moved to new category",
      onSuccess: () => {
        setSelection({})
        setTargetCategory("")
      },
    }
  )

  const bulkDelete = useAdminMutation(
    (ids: string[]) => adminActions.bulkDeleteProducts(ids),
    {
      invalidate: [["products"], ["dashboard"]],
      shop: ["catalog"],
      success: "Products deleted",
      onSuccess: () => {
        setSelection({})
        setBulkDeleteOpen(false)
      },
    }
  )

  const busy = bulkStatus.isPending || bulkCategory.isPending || bulkDelete.isPending

  // Stable columns (TanStack v9 recomputes row models when columns change)
  const columns = useMemo<AdminColumn<Product>[]>(() => {
    const h = columnHelper<Product>()
    return [
      h.accessor("name", {
        header: "Product",
        cell: (c) => {
          const p = c.row.original
          return (
            <div className="flex min-w-56 items-center gap-3">
              <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image
                  src={p.images[0]?.url ?? "/placeholder.svg"}
                  alt=""
                  fill
                  sizes="44px"
                  unoptimized
                  className="object-cover"
                />
              </span>
              <div className="min-w-0">
                <Link
                  href={`/admin/products/${p.id}`}
                  className="line-clamp-1 font-medium hover:text-primary"
                >
                  {p.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {p.id.toUpperCase()}
                  {p.variants?.length
                    ? ` · ${p.variants.length} variants (${[...new Set(p.variants.map(variantName))].slice(0, 4).join(", ")}${p.variants.length > 4 ? "…" : ""})`
                    : ""}
                </p>
              </div>
            </div>
          )
        },
      }),
      h.accessor((p) => p.category.name, { id: "category", header: "Category" }),
      h.accessor("price", {
        header: "Price",
        sortFn: "basic",
        cell: (c) => {
          const p = c.row.original
          return (
            <div className="tabular-nums">
              <p className="font-medium">{formatPrice(p.price)}</p>
              {p.comparePrice ? (
                <p className="text-xs text-muted-foreground line-through">
                  {formatPrice(p.comparePrice)}
                </p>
              ) : null}
            </div>
          )
        },
      }),
      h.accessor("stock", {
        header: "Stock",
        sortFn: "basic",
        cell: (c) => {
          const n = c.row.original.stock
          return (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                n === 0
                  ? "bg-red-100 text-red-800"
                  : n <= 5
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
              )}
            >
              {n === 0 ? "Out of stock" : `${n}`}
            </span>
          )
        },
      }),
      h.display({
        id: "flags",
        header: "Tags",
        cell: (c) => (
          <div className="flex gap-1">
            {c.row.original.status === "draft" && (
              <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-800">
                Draft
              </span>
            )}
            {c.row.original.status === "hidden" && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                Hidden
              </span>
            )}
            {c.row.original.isFeatured && (
              <span className="rounded bg-accent px-1.5 py-0.5 text-xs text-primary">
                Featured
              </span>
            )}
            {c.row.original.isNew && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs">New</span>
            )}
          </div>
        ),
      }),
      h.display({
        id: "actions",
        header: "",
        cell: (c) => (
          <div className="flex justify-end gap-1">
            <Button asChild variant="ghost" size="icon-sm" aria-label="Edit">
              <Link href={`/admin/products/${c.row.original.id}`}>
                <Pencil />
              </Link>
            </Button>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete"
                className="hover:text-destructive"
                onClick={() => setToDelete(c.row.original)}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        ),
      }),
    ]
  }, [canEdit])

  return (
    <div>
      <PageHeader
        title="Products"
        description={data ? `${data.meta.total} products` : "Your catalog"}
      >
        {canEdit && (
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus /> New product
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full min-w-0 sm:max-w-sm sm:min-w-60 sm:flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
              setSelection({})
            }}
            placeholder="Name, slug or SKU..."
            className="pl-9"
            aria-label="Search products"
          />
        </div>
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v)
            setPage(1)
            setSelection({})
          }}
        >
          <SelectTrigger className="w-full sm:w-48" aria-label="Category filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories
              .filter((c) => !c.parentId)
              .map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v)
            setPage(1)
            setSelection({})
          }}
        >
          <SelectTrigger className="w-full sm:w-40" aria-label="Visibility filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All visibility</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {canEdit && selectedIds.length > 0 && (
        <div
          role="toolbar"
          aria-label="Bulk actions"
          className="sticky top-14 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-accent p-2.5 shadow-sm"
        >
          <span className="px-1 text-sm font-semibold">
            {selectedIds.length} selected
          </span>

          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => bulkStatus.mutate({ ids: selectedIds, status: "ACTIVE" })}
          >
            <Eye className="size-4" /> Active
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => bulkStatus.mutate({ ids: selectedIds, status: "HIDDEN" })}
          >
            <EyeOff className="size-4" /> Hidden
          </Button>

          <div className="flex items-center gap-1.5">
            <Select
              value={targetCategory}
              onValueChange={(val) => {
                if (val) {
                  bulkCategory.mutate({ ids: selectedIds, categoryId: val })
                  setTargetCategory("")
                }
              }}
            >
              <SelectTrigger
                size="sm"
                className="w-44 bg-background"
                aria-label="Move to category"
              >
                <FolderTree className="size-3.5 text-muted-foreground" />
                <SelectValue placeholder="Move category..." />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((c) => !c.parentId)
                  .flatMap((parent) => [
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.name}
                    </SelectItem>,
                    ...categories
                      .filter((c) => c.parentId === parent.id)
                      .map((sub) => (
                        <SelectItem
                          key={sub.id}
                          value={sub.id}
                          className="pl-6 text-muted-foreground"
                        >
                          ↳ {sub.name}
                        </SelectItem>
                      )),
                  ])}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:bg-destructive hover:text-white"
            disabled={busy}
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="size-4" /> Delete ({selectedIds.length})
          </Button>

          <Button
            size="icon-sm"
            variant="ghost"
            className="ml-auto"
            aria-label="Clear selection"
            onClick={() => setSelection({})}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : (
        <div className={cn(isFetching && "opacity-70 transition-opacity")}>
          <DataTable
            key={`${category}-${status}-${q}-${page}`}
            columns={columns}
            data={data?.data ?? []}
            pageSize={PAGE_SIZE}
            emptyText={data ? "No products found" : "Loading..."}
            getRowId={(p) => p.id}
            selection={canEdit ? selection : undefined}
            onSelectionChange={canEdit ? setSelection : undefined}
          />
          {data && (
            <Pager
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              onChange={(p) => {
                setPage(p)
                setSelection({})
              }}
            />
          )}
        </div>
      )}

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} products?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedIds.length} selected product(s) will be permanently deleted. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault()
                bulkDelete.mutate(selectedIds)
              }}
            >
              {bulkDelete.isPending ? "Deleting..." : "Delete all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{toDelete?.name}&rdquo; will be permanently deleted. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={remove.isPending}
              onClick={(e) => {
                e.preventDefault()
                if (toDelete) remove.mutate(toDelete.id)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function NewProductView() {
  return (
    <div>
      <PageHeader title="New product" />
      <ProductForm />
    </div>
  )
}

/** Uses useParams → rendered inside the admin layout's <Suspense>. */
export function EditProductView() {
  const { id } = useParams<{ id: string }>()
  const { data: product, isPending } = useAdminQuery(["products", "detail", id], () =>
    adminQueries.product(id)
  )
  if (isPending) return <Skeleton className="h-96 rounded-xl" />
  if (!product) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="font-semibold">Product not found</p>
        <Button asChild variant="outline">
          <Link href="/admin/products">Back to products</Link>
        </Button>
      </div>
    )
  }
  return (
    <div>
      <PageHeader title="Edit product" description={product.name}>
        <Button asChild variant="outline">
          <Link href={`/products/${product.slug}`} target="_blank">
            View in shop
          </Link>
        </Button>
      </PageHeader>
      <ProductForm key={product.updatedAt} product={product} />
    </div>
  )
}
