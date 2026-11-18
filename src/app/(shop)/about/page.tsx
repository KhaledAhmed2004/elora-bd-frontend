import { Heart, RotateCcw, ShieldCheck, Truck } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: "About Us",
  description: `${siteConfig.name} — a trusted online fashion shop for women in Bangladesh.`,
}

const values = [
  {
    icon: ShieldCheck,
    title: "Quality Product",
    text: "We personally check every product before shipping",
  },
  {
    icon: Truck,
    title: "Nationwide Delivery",
    text: "Home delivery to all 64 districts, Cash on Delivery",
  },
  {
    icon: RotateCcw,
    title: "Easy Exchange",
    text: "Wrong size? Exchange within 7 days",
  },
  { icon: Heart, title: "Customer First", text: "Your satisfaction is our top priority" },
]

export default function AboutPage() {
  return (
    <div className="shop-container py-6">
      <Breadcrumbs items={[{ label: "About Us" }]} />
      <section className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
        <div className="space-y-4">
          <h1 className="font-display text-3xl font-bold md:text-4xl">
            Fashion for the women of Bangladesh, handpicked with love
          </h1>
          <p className="text-lg text-muted-foreground">
            {siteConfig.name} began with a simple idea — instead of going from shop to
            shop, buy beautiful Saree, Three Piece and Western dresses from a trusted
            place without leaving home.
          </p>
          <p className="text-muted-foreground">
            We source products directly from weavers and artisans in Dhaka, Tangail and
            Narayanganj, so you get great quality at a fair price. We deliver right to
            your door anywhere in the country, with Cash on Delivery.
          </p>
          <Button asChild size="lg">
            <Link href="/products">View Collection</Link>
          </Button>
        </div>
        <div className="relative aspect-4/3 overflow-hidden rounded-2xl shadow-sm ring-1 ring-border">
          <Image
            src="/brand/elora-store-interior.jpg"
            alt={`${siteConfig.name} Showroom`}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="mb-6 text-center font-display text-2xl font-bold">
          Why {siteConfig.name}?
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-2xl border p-6 text-center">
              <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-accent">
                <Icon className="size-6 text-primary" />
              </span>
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
