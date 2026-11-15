import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { unsplash } from "@/data/images"

const promos = [
  {
    title: "Saree Collection",
    text: "Jamdani, Katan, Silk — up to 20% off",
    href: "/category/saree",
    image: unsplash("1610030469983-98e550d6193c", 900),
  },
  {
    title: "Jewelry Corner",
    text: "Starting from ৳990 — the perfect gift idea",
    href: "/category/jewelry",
    image: unsplash("1590548784585-643d2b9f2925", 900),
  },
]

export function PromoBanners() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {promos.map((p) => (
        <Link
          key={p.href}
          href={p.href}
          className="group relative flex aspect-16/10 min-h-[190px] items-center overflow-hidden rounded-2xl ring-1 ring-gold/30 sm:aspect-2/1 sm:min-h-0"
        >
          <Image
            src={p.image}
            alt=""
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-r from-espresso/90 via-espresso/55 to-espresso/5" />
          <div className="relative max-w-[82%] p-5 text-white sm:max-w-[65%] sm:p-8">
            <h3 className="font-display text-2xl font-bold sm:text-3xl">{p.title}</h3>
            <p className="mt-1 text-sm text-white/90">{p.text}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold-light underline-offset-4 group-hover:underline">
              Shop Now <ArrowRight className="size-4" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
