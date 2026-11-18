"use client"

import { useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  Bell,
  ChevronsUpDown,
  ExternalLink,
  KeyRound,
  Lock,
  LogOut,
  type LucideIcon,
  MessageSquareText,
  PhoneMissed,
  Plus,
  ShoppingBag,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Fragment, useEffect, useState } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { siteConfig } from "@/config/site"
import { useAdminTheme } from "@/hooks/use-admin-theme"
import { adminAuth, refreshSession } from "@/lib/admin/admin-api"
import { adminQueries, useAdminQuery } from "@/lib/admin/queries"
import { cn } from "@/lib/utils"
import { useAdminAuthStore } from "@/store/admin-auth-store"

import { AdminCommand } from "./admin-command"
import { breadcrumbs, canAccess, isActive, NAV_GROUPS } from "./admin-nav"
import { EmptyState } from "./admin-ui"
import { ChangePasswordDialog } from "./change-password-dialog"
import { NewOrderNotifier } from "./new-order-notifier"

export function AdminShell({ children }: { children: React.ReactNode }) {
  useAdminTheme()
  const status = useAdminAuthStore((s) => s.status)
  const expiresAt = useAdminAuthStore((s) => s.expiresAt)
  const router = useRouter()
  const pathname = usePathname()
  const qc = useQueryClient()

  // Restore the session from the refresh cookie, or send to the login page
  useEffect(() => {
    if (status === "checking") void refreshSession()
    if (status === "signed-out") {
      qc.removeQueries({ queryKey: ["admin"] })
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [status, pathname, router, qc])

  // Renew the 15-minute access token a minute before it runs out
  useEffect(() => {
    if (status !== "signed-in") return
    const t = setTimeout(
      () => void refreshSession(),
      Math.max(expiresAt - Date.now() - 60_000, 5_000)
    )
    return () => clearTimeout(t)
  }, [status, expiresAt])

  if (status !== "signed-in") {
    return (
      <div className="flex min-h-svh">
        <div className="hidden w-64 bg-sidebar md:block" />
        <div className="flex-1">
          <div className="h-14 border-b bg-background" />
          <div className="space-y-4 p-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <NewOrderNotifier />
      <AdminSidebar />
      <SidebarInset className="min-w-0 bg-(--admin-canvas)">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur md:px-5">
          <SidebarTrigger className="text-muted-foreground" />
          <Separator orientation="vertical" className="mr-1 h-4! self-center!" />
          <Crumbs pathname={pathname} />
          <div className="ml-auto flex flex-1 items-center justify-end gap-1.5">
            <AdminCommand />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                >
                  <a href="/" target="_blank" rel="noopener" aria-label="View store">
                    <ExternalLink />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>View store</TooltipContent>
            </Tooltip>
            <Notifications />
            {/* The orders pages carry their own "New order" button */}
            {!pathname.startsWith("/admin/orders") && (
              <Button asChild size="sm" className="ml-1 max-sm:hidden">
                <Link href="/admin/orders/new">
                  <Plus /> New order
                </Link>
              </Button>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function Crumbs({ pathname }: { pathname: string }) {
  const crumbs = breadcrumbs(pathname)
  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <Fragment key={c.label}>
              {i > 0 && <BreadcrumbSeparator className={cn(!last && "max-sm:hidden")} />}
              <BreadcrumbItem className={cn(!last && "max-sm:hidden")}>
                {c.href && !last ? (
                  <BreadcrumbLink asChild>
                    <Link href={c.href}>{c.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate font-medium">
                    {c.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/** Bell: the things waiting for someone to act on them */
function Notifications() {
  const [open, setOpen] = useState(false)
  const { data } = useAdminQuery(["dashboard"], adminQueries.dashboard, {
    refetchInterval: 30_000,
  })
  const outOfStock = data?.lowStock.filter((p) => p.stock === 0).length ?? 0
  const all: {
    icon: LucideIcon
    count: number
    title: string
    hint: string
    href: string
  }[] = [
    {
      icon: ShoppingBag,
      count: data?.pending ?? 0,
      title: "Orders waiting for a confirmation call",
      hint: "Call the customer and confirm",
      href: "/admin/orders?status=pending",
    },
    {
      icon: PhoneMissed,
      count: data?.incompleteOrders ?? 0,
      title: "Incomplete checkouts to follow up",
      hint: "Customers who left before ordering",
      href: "/admin/incomplete",
    },
    {
      icon: MessageSquareText,
      count: data?.pendingReviews ?? 0,
      title: "Reviews waiting for approval",
      hint: "Approve or hide them",
      href: "/admin/reviews",
    },
    {
      icon: AlertTriangle,
      count: outOfStock,
      title: "Products out of stock",
      hint: "Restock or hide them",
      href: "/admin/products",
    },
  ]
  const items = all.filter((i) => i.count > 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground"
          aria-label={items.length ? `Notifications (${items.length})` : "Notifications"}
        >
          <Bell />
          {items.length > 0 && (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 ring-2 ring-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-0 p-0">
        <p className="border-b px-4 py-3 text-sm font-semibold">Needs attention</p>
        {items.length ? (
          <ul className="divide-y">
            {items.map(({ icon: Icon, count, title, hint, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-muted/60"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium">{title}</span>
                    <span className="block text-xs text-muted-foreground">{hint}</span>
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                    {count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            You&apos;re all caught up
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}

function AdminSidebar() {
  const pathname = usePathname()
  const { setOpenMobile, isMobile } = useSidebar()
  const admin = useAdminAuthStore((s) => s.admin)
  const [passwordOpen, setPasswordOpen] = useState(false)
  // Badge numbers: refreshed every 30 s
  const { data } = useAdminQuery(["dashboard"], adminQueries.dashboard, {
    refetchInterval: 30_000,
  })
  const badges: Record<string, number> = {
    "/admin/orders": data?.pending ?? 0,
    "/admin/reviews": data?.pendingReviews ?? 0,
    "/admin/incomplete": data?.incompleteOrders ?? 0,
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/40 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip={`${siteConfig.name} Admin Panel`}
              className="h-auto rounded-xl py-1 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0! hover:bg-sidebar-accent/40"
            >
              <Link
                href="/admin"
                onClick={() => setOpenMobile(false)}
                className="flex w-full items-center justify-center"
              >
                {/* Collapsed state (icon-only mode when sidebar is collapsed) */}
                <span className="hidden aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent/80 p-1 ring-1 ring-sidebar-primary/40 group-data-[collapsible=icon]:flex">
                  <Image
                    src="/brand/elora-logo.png"
                    alt={siteConfig.name}
                    width={32}
                    height={32}
                    className="h-full w-full object-contain"
                  />
                </span>

                {/* Expanded state: Sleek, compact centered luxury brand layout */}
                <div className="flex w-full flex-1 flex-col items-center justify-center gap-1 overflow-hidden text-center group-data-[collapsible=icon]:hidden">
                  <Image
                    src="/brand/elora-logo.png"
                    alt={siteConfig.name}
                    width={130}
                    height={65}
                    priority
                    className="h-9 w-auto object-contain transition-transform duration-200 hover:scale-[1.03]"
                  />
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="h-px w-4 bg-gold/25" />
                    <span className="text-[9px] font-semibold tracking-[0.25em] text-gold-ink/80 uppercase">
                      Admin Panel
                    </span>
                    <span className="h-px w-4 bg-gold/25" />
                  </div>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => canAccess(i.access, admin?.role))
          if (!items.length) return null
          return (
            <SidebarGroup key={group.label ?? "main"} className="py-1.5">
              {group.label && (
                <SidebarGroupLabel className="text-[11px] tracking-wider text-sidebar-foreground/50 uppercase">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map(({ href, label, icon: Icon }) => {
                    const active = isActive(href, pathname)
                    const badge = badges[href] ?? 0
                    return (
                      <SidebarMenuItem key={href}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={badge ? `${label} (${badge})` : label}
                          className="data-active:shadow-[inset_2px_0_0_var(--sidebar-primary)] data-active:[&>svg]:text-sidebar-primary"
                        >
                          <Link href={href} onClick={() => setOpenMobile(false)}>
                            <Icon /> <span>{label}</span>
                          </Link>
                        </SidebarMenuButton>
                        {badge > 0 && (
                          <SidebarMenuBadge className="bg-sidebar-primary text-sidebar-primary-foreground peer-hover/menu-button:text-sidebar-primary-foreground peer-data-active/menu-button:text-sidebar-primary-foreground">
                            {badge > 99 ? "99+" : badge}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                    {admin?.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-medium text-sidebar-accent-foreground">
                      {admin?.name}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/60 capitalize">
                      {admin?.role.toLowerCase()}
                    </span>
                  </span>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={8}
                className="min-w-56"
              >
                <DropdownMenuLabel className="font-normal">
                  <span className="block font-medium text-foreground">{admin?.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {admin?.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/" target="_blank" rel="noopener">
                    <ExternalLink /> View store
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setPasswordOpen(true)}>
                  <KeyRound /> Change password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => void adminAuth.logout()}
                >
                  <LogOut /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

/** Shown by pages a role may not open (the API refuses them anyway) */
export function NoAccess() {
  return (
    <EmptyState
      icon={Lock}
      title="You don't have access to this page"
      description="Ask the shop owner if you need it."
      className="py-20"
    />
  )
}
