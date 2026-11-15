"use client"

import { Heart, LayoutDashboard, LogOut, MapPin, Package, UserRound } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

import { useHydrated } from "@/hooks/use-hydrated"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"

const links = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/addresses", label: "Address Book", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/profile", label: "Profile", icon: UserRound },
]

export function AccountNav() {
  const pathname = usePathname()
  const router = useRouter()
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <nav aria-label="Account" className="space-y-4">
      {hydrated && user?.name && (
        <div className="hidden items-center gap-3 rounded-xl bg-accent/50 p-3 lg:flex">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.phone}</p>
          </div>
        </div>
      )}
      <ul className="-mx-4 scrollbar-none flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/account" ? pathname === href : pathname.startsWith(href)
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors lg:rounded-lg lg:border-transparent lg:px-3",
                  active
                    ? "border-primary bg-primary text-primary-foreground lg:bg-accent lg:font-medium lg:text-primary"
                    : "hover:bg-muted"
                )}
              >
                <Icon className="size-4" /> {label}
              </Link>
            </li>
          )
        })}
        {hydrated && user && (
          <li className="shrink-0">
            <button
              type="button"
              onClick={() => {
                logout()
                toast.success("You've been logged out")
                router.push("/")
              }}
              className="flex w-full items-center gap-2.5 rounded-full border px-4 py-2 text-sm whitespace-nowrap text-muted-foreground hover:bg-muted hover:text-destructive lg:rounded-lg lg:border-transparent lg:px-3"
            >
              <LogOut className="size-4" /> Logout
            </button>
          </li>
        )}
      </ul>
    </nav>
  )
}
