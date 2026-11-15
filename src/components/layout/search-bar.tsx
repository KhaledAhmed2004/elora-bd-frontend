"use client"

import { Search, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useId, useRef, useState } from "react"

import { analytics } from "@/lib/analytics"
import { useDebounced } from "@/hooks/use-debounced"
import { formatPrice } from "@/lib/format"
import { shopApi } from "@/lib/shop-api"
import { cn } from "@/lib/utils"

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter()
  const listId = useId()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const term = useDebounced(query.trim(), 250)
  const { data: suggestions = [] } = useQuery({
    queryKey: ["suggest", term],
    queryFn: () => shopApi.suggest(term),
    enabled: term.length >= 2,
    staleTime: 60_000,
    placeholderData: (prev) => (term.length >= 2 ? prev : []),
  })
  const inputRef = useRef<HTMLInputElement>(null)

  const showList = open && suggestions.length > 0

  function close() {
    setOpen(false)
    setActive(-1)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const pick = suggestions[active]
    if (pick) {
      router.push(`/products/${pick.slug}`)
    } else {
      const q = query.trim()
      if (!q) return
      analytics.search(q)
      router.push(`/search?q=${encodeURIComponent(q)}`)
    }
    close()
    inputRef.current?.blur()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!showList) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => (i + 1) % suggestions.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === "Escape") {
      close()
    }
  }

  return (
    <form role="search" onSubmit={submit} className={cn("relative w-full", className)}>
      <div className="flex h-10 items-center rounded-full border bg-muted/50 pr-1 pl-4 transition-colors focus-within:border-primary focus-within:bg-background">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(close, 150)}
          onKeyDown={onKeyDown}
          placeholder="Search Saree, Three Piece, Kurti..."
          aria-label="Search products"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => {
              setQuery("")
              inputRef.current?.focus()
            }}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
        <button
          type="submit"
          aria-label="Search"
          className="ml-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Search className="size-4" />
        </button>
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-12 z-50 overflow-hidden rounded-xl border bg-popover p-1 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li key={s.id} role="option" aria-selected={i === active}>
              <Link
                href={`/products/${s.slug}`}
                onClick={close}
                className={cn(
                  "flex items-center gap-3 rounded-lg p-2 text-sm hover:bg-muted",
                  i === active && "bg-muted"
                )}
              >
                {s.image && (
                  <Image
                    src={s.image}
                    alt=""
                    width={40}
                    height={40}
                    className="size-10 rounded-md object-cover"
                  />
                )}
                <span className="line-clamp-1 flex-1">{s.name}</span>
                <span className="font-semibold tabular-nums">{formatPrice(s.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
