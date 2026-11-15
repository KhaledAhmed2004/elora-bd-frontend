"use client"

import { House, LayoutGrid, ShoppingCart, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useHydrated } from "@/hooks/use-hydrated"
import { cn } from "@/lib/utils"
import { selectCartCount, useCartStore } from "@/store/cart-store"

const items = [
  { href: "/", label: "Home", icon: House, match: (p: string) => p === "/" },
  {
    href: "/products",
    label: "Category",
    icon: LayoutGrid,
    match: (p: string) => p.startsWith("/products") || p.startsWith("/category"),
  },
  {
    href: "/account",
    label: "Account",
    icon: User,
    match: (p: string) => p.startsWith("/account") || p === "/login",
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const hydrated = useHydrated()
  const count = useCartStore(selectCartCount)
  const openCart = useCartStore((s) => s.openCart)

  const linkClass = (active: boolean) =>
    cn(
      "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
      active ? "text-primary" : "text-muted-foreground"
    )

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="flex h-14">
        {items.slice(0, 2).map(({ href, label, icon: Icon, match }) => (
          <Link key={href} href={href} className={linkClass(match(pathname))}>
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
        <button type="button" onClick={openCart} className={linkClass(false)}>
          <span className="relative">
            <ShoppingCart className="size-5" />
            {hydrated && count > 0 && (
              <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sale px-1 text-[10px] font-bold text-sale-foreground">
                {count}
              </span>
            )}
          </span>
          Cart
        </button>
        {items.slice(2).map(({ href, label, icon: Icon, match }) => (
          <Link key={href} href={href} className={linkClass(match(pathname))}>
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
