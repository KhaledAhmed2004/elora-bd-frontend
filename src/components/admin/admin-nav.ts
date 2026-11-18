import {
  Ban,
  ChartColumn,
  FolderTree,
  GalleryHorizontal,
  History,
  LayoutDashboard,
  type LucideIcon,
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

import type { AdminRole } from "@/store/admin-auth-store"

type Access = "all" | "manager" | "owner"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  access?: Access
}

export const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
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
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      {
        href: "/admin/purchases",
        label: "Purchases & Suppliers",
        icon: PackagePlus,
        access: "manager",
      },
      { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        href: "/admin/coupons",
        label: "Coupons",
        icon: TicketPercent,
        access: "manager",
      },
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

export const NAV = NAV_GROUPS.flatMap((g) => g.items)

export const canAccess = (access: Access | undefined, role?: AdminRole) =>
  !access ||
  access === "all" ||
  role === "OWNER" ||
  (access === "manager" && role === "MANAGER")

export const isActive = (href: string, pathname: string) =>
  href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`)

/** "/admin/orders/abc/edit" → Orders › Details › Edit */
export function breadcrumbs(pathname: string): { label: string; href?: string }[] {
  const section = NAV.find((n) => n.href !== "/admin" && isActive(n.href, pathname))
  if (!section) return [{ label: "Dashboard" }]
  const rest = pathname.slice(section.href.length).split("/").filter(Boolean)
  if (!rest.length) return [{ label: section.label }]
  const crumbs: { label: string; href?: string }[] = [
    { label: section.label, href: section.href },
  ]
  if (rest[0] === "new") crumbs.push({ label: "New" })
  else {
    const detail = `${section.href}/${rest[0]}`
    if (rest[1] === "edit")
      crumbs.push({ label: "Details", href: detail }, { label: "Edit" })
    else crumbs.push({ label: "Details" })
  }
  return crumbs
}
