import { Logo } from "@/components/shared/logo"
import { getCategories } from "@/lib/data"

import { CategoryNav } from "./category-nav"
import { HeaderActions } from "./header-actions"
import { MobileMenu } from "./mobile-menu"
import { SearchBar } from "./search-bar"

export async function Header() {
  const categories = await getCategories()

  return (
    <header className="sticky top-0 z-40 border-b border-gold/20 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="shop-container flex h-16 items-center gap-2 md:gap-6">
        <MobileMenu categories={categories} />
        <Logo eager />
        <SearchBar className="mx-auto hidden max-w-xl md:block" />
        <div className="ml-auto md:ml-0">
          <HeaderActions />
        </div>
      </div>
      <div className="shop-container pb-3 md:hidden">
        <SearchBar />
      </div>
      <CategoryNav categories={categories} />
    </header>
  )
}
