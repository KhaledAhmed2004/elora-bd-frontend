"use client"

import { ExternalLink, Package, Plus, Search, ShoppingBag, UserRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useDebounced } from "@/hooks/use-debounced"
import { adminQueries, useAdminQuery } from "@/lib/admin/queries"
import { formatPrice } from "@/lib/format"
import { useAdminAuthStore } from "@/store/admin-auth-store"

import { canAccess, NAV } from "./admin-nav"
import { StatusBadge } from "./admin-ui"

const ACTIONS = [
  { href: "/admin/orders/new", label: "Create order", icon: Plus },
  { href: "/admin/products/new", label: "Add product", icon: Plus },
]

/** Ctrl/⌘ + K: jump to any page, or find an order, product or customer */
export function AdminCommand() {
  const router = useRouter()
  const role = useAdminAuthStore((s) => s.admin?.role)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const q = useDebounced(search.trim(), 300)
  const enabled = open && q.length >= 2

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const orders = useAdminQuery(
    ["orders", "palette", q],
    () => adminQueries.orders({ q, limit: 5 }),
    { enabled }
  )
  const products = useAdminQuery(
    ["products", "palette", q],
    () => adminQueries.products({ q, limit: 5 }),
    { enabled }
  )
  const customers = useAdminQuery(
    ["customers", "palette", q],
    () => adminQueries.customers({ q, limit: 4 }),
    { enabled }
  )
  const searching =
    enabled && (orders.isFetching || products.isFetching || customers.isFetching)

  function go(href: string) {
    setOpen(false)
    setSearch("")
    router.push(href)
  }

  // Server results are already matched by the API; prefixing the typed text
  // keeps cmdk's own filter from hiding them.
  const hit = (text: string) => `${search} ${text}`

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-full max-w-sm items-center gap-2 rounded-lg border bg-muted/60 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none max-md:size-8 max-md:justify-center max-md:border-transparent max-md:bg-transparent max-md:px-0"
        aria-label="Search (Ctrl+K)"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left max-md:hidden">Search orders, products…</span>
        <kbd className="rounded border bg-background px-1.5 font-sans text-[11px] font-medium max-md:hidden">
          Ctrl K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) setSearch("")
        }}
        title="Search"
        description="Jump to a page or find an order, product or customer"
        className="sm:max-w-xl"
      >
        <Command>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search pages, order no., phone, product…"
          />
          <CommandList className="max-h-96">
            <CommandEmpty>{searching ? "Searching…" : "No results found"}</CommandEmpty>

            {enabled && !!orders.data?.data.length && (
              <CommandGroup heading="Orders">
                {orders.data.data.map((o) => (
                  <CommandItem
                    key={o.id}
                    value={hit(`order ${o.id}`)}
                    onSelect={() => go(`/admin/orders/${o.id}`)}
                  >
                    <ShoppingBag />
                    <span className="font-medium">{o.orderNumber}</span>
                    <span className="truncate text-muted-foreground">
                      {o.shippingAddress.fullName} · {o.shippingAddress.phone}
                    </span>
                    <span className="ml-auto flex shrink-0 items-center gap-2">
                      <StatusBadge status={o.status} />
                      <span className="tabular-nums">{formatPrice(o.total)}</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {enabled && !!products.data?.data.length && (
              <CommandGroup heading="Products">
                {products.data.data.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={hit(`product ${p.id}`)}
                    onSelect={() => go(`/admin/products/${p.id}`)}
                  >
                    <Package />
                    <span className="truncate">{p.name}</span>
                    <span className="ml-auto shrink-0 text-muted-foreground tabular-nums">
                      {p.stock} in stock · {formatPrice(p.price)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {enabled && !!customers.data?.data.length && (
              <CommandGroup heading="Customers">
                {customers.data.data.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={hit(`customer ${c.id}`)}
                    onSelect={() => go(`/admin/customers/${c.phone}`)}
                  >
                    <UserRound />
                    <span className="truncate">{c.name}</span>
                    <span className="text-muted-foreground">{c.phone}</span>
                    <span className="ml-auto shrink-0 text-muted-foreground tabular-nums">
                      {c.orders} orders
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandGroup heading="Quick actions">
              {ACTIONS.map(({ href, label, icon: Icon }) => (
                <CommandItem key={href} value={label} onSelect={() => go(href)}>
                  <Icon />
                  {label}
                </CommandItem>
              ))}
              <CommandItem
                value="View store website"
                onSelect={() => {
                  setOpen(false)
                  window.open("/", "_blank", "noopener")
                }}
              >
                <ExternalLink />
                View store
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Pages">
              {NAV.filter((n) => canAccess(n.access, role)).map(
                ({ href, label, icon: Icon }) => (
                  <CommandItem key={href} value={label} onSelect={() => go(href)}>
                    <Icon />
                    {label}
                    {href === "/admin" && <CommandShortcut>Home</CommandShortcut>}
                  </CommandItem>
                )
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
