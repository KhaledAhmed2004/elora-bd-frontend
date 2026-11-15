"use client"

import { useQueryClient } from "@tanstack/react-query"
import {
  Ban,
  ChartColumn,
  FolderTree,
  GalleryHorizontal,
  History,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquareText,
  Package,
  PackagePlus,
  PhoneMissed,
  Settings,
  ShoppingBag,
  TicketPercent,
  Truck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { siteConfig } from "@/config/site"
import { adminAuth, refreshSession } from "@/lib/admin/admin-api"
import { adminQueries, useAdminQuery } from "@/lib/admin/queries"
import { type AdminRole, useAdminAuthStore } from "@/store/admin-auth-store"

import { ChangePasswordDialog } from "./change-password-dialog"
import { NewOrderNotifier } from "./new-order-notifier"

type Access = "all" | "manager" | "owner"

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  access?: Access
}

const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/incomplete", label: "Incomplete orders", icon: PhoneMissed },
      { href: "/admin/courier", label: "Courier & COD", icon: Truck },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/blacklist", label: "Blacklist", icon: Ban },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      {
        href: "/admin/purchases",
        label: "Purchases & Suppliers",
        icon: PackagePlus,
        access: "manager",
      },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      {
        href: "/admin/banners",
        label: "Banners",
        icon: GalleryHorizontal,
        access: "manager",
      },
      {
        href: "/admin/popups",
        label: "Campaign popups",
        icon: Megaphone,
        access: "manager",
      },
      {
        href: "/admin/coupons",
        label: "Coupons",
        icon: TicketPercent,
        access: "manager",
      },
      { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText },
    ],
  },
  {
    label: "Accounts",
    items: [
      { href: "/admin/reports", label: "Reports", icon: ChartColumn, access: "manager" },
      { href: "/admin/expenses", label: "Expenses", icon: Wallet, access: "manager" },
    ],
  },
  {
    label: "Shop",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/staff", label: "Staff", icon: UserCog, access: "owner" },
      {
        href: "/admin/activity",
        label: "Activity log",
        icon: History,
        access: "manager",
      },
    ],
  },
]
const NAV = NAV_GROUPS.flatMap((g) => g.items)

const allowed = (access: Access | undefined, role?: AdminRole) =>
  !access ||
  access === "all" ||
  role === "OWNER" ||
  (access === "manager" && role === "MANAGER")

export function AdminShell({ children }: { children: React.ReactNode }) {
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
        <Skeleton className="hidden w-64 rounded-none md:block" />
        <div className="flex-1 space-y-4 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <NewOrderNotifier />
      <AdminSidebar />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger />
          <span className="text-sm text-muted-foreground">
            {NAV.find((n) =>
              n.href === "/admin" ? pathname === n.href : pathname.startsWith(n.href)
            )?.label ?? "Admin"}
          </span>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function AdminSidebar() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const admin = useAdminAuthStore((s) => s.admin)
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
    <Sidebar>
      <SidebarHeader className="border-b">
        <Link href="/admin" className="flex items-center gap-2 px-2 py-1.5 font-heading">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingBag className="size-4" />
          </span>
          <span className="leading-tight">
            <span className="block font-bold">{siteConfig.name}</span>
            <span className="block text-xs text-muted-foreground">Admin Panel</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => allowed(i.access, admin?.role))
          if (!items.length) return null
          return (
            <SidebarGroup key={group.label ?? "main"}>
              {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map(({ href, label, icon: Icon }) => {
                    const active =
                      href === "/admin" ? pathname === href : pathname.startsWith(href)
                    return (
                      <SidebarMenuItem key={href}>
                        <SidebarMenuButton asChild isActive={active} tooltip={label}>
                          <Link href={href} onClick={() => setOpenMobile(false)}>
                            <Icon /> <span>{label}</span>
                          </Link>
                        </SidebarMenuButton>
                        {(badges[href] ?? 0) > 0 && (
                          <SidebarMenuBadge className="bg-sale text-sale-foreground peer-hover/menu-button:text-sale-foreground peer-data-active/menu-button:text-sale-foreground">
                            {badges[href]}
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
      <SidebarFooter className="border-t">
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
            {admin?.name.charAt(0)}
          </span>
          <div className="min-w-0 flex-1 text-xs">
            <p className="truncate font-medium">{admin?.name}</p>
            <p className="truncate text-muted-foreground">
              {admin?.role.toLowerCase()} · {admin?.email}
            </p>
          </div>
          <ChangePasswordDialog>
            <Button variant="ghost" size="icon-sm" aria-label="Change password">
              <KeyRound />
            </Button>
          </ChangePasswordDialog>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Logout"
            onClick={() => void adminAuth.logout()}
          >
            <LogOut />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

/** Shown by pages a role may not open (the API refuses them anyway) */
export function NoAccess() {
  return (
    <div className="space-y-2 py-16 text-center">
      <p className="font-semibold">You don&apos;t have access to this page</p>
      <p className="text-sm text-muted-foreground">Ask the shop owner if you need it.</p>
    </div>
  )
}
