"use client"

import { ChevronRight, Menu, Package, Phone, User } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Logo } from "@/components/shared/logo"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useSiteSettings } from "@/providers/site-settings"
import type { Category } from "@/types"

export function MobileMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const { phone } = useSiteSettings()
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label="Menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85%] max-w-sm gap-0 p-0">
        <SheetHeader className="border-b">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Logo onClick={close} />
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <p className="px-2 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Categories
          </p>
          <Accordion type="single" collapsible>
            {categories.map((cat) =>
              cat.children?.length ? (
                <AccordionItem key={cat.id} value={cat.id} className="border-none">
                  <AccordionTrigger className="px-2 py-2.5 text-sm hover:no-underline">
                    {cat.name}
                  </AccordionTrigger>
                  <AccordionContent className="pb-1">
                    <div className="ml-2 flex flex-col border-l pl-2">
                      <Link
                        href={`/category/${cat.slug}`}
                        onClick={close}
                        className="rounded-md px-2 py-2 text-sm font-medium text-primary"
                      >
                        All {cat.name}
                      </Link>
                      {cat.children.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/category/${sub.slug}`}
                          onClick={close}
                          className="rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ) : (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  onClick={close}
                  className="flex items-center justify-between rounded-md px-2 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  {cat.name}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              )
            )}
          </Accordion>
        </nav>

        <div className="space-y-1 border-t p-3">
          <Link
            href="/account"
            onClick={close}
            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
          >
            <User className="size-4" /> Login / Account
          </Link>
          <Link
            href="/track-order"
            onClick={close}
            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
          >
            <Package className="size-4" /> Track Order
          </Link>
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
          >
            <Phone className="size-4" /> {phone}
          </a>
        </div>
      </SheetContent>
    </Sheet>
  )
}
