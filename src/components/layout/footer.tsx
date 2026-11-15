import { Mail, MapPin, Phone } from "lucide-react"
import { cacheLife } from "next/cache"
import Link from "next/link"

import { BrandDivider } from "@/components/shared/brand-divider"
import { Logo } from "@/components/shared/logo"
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/components/shared/social-icons"
import { siteConfig } from "@/config/site"
import { getStoreSettings } from "@/lib/site-settings"

const columns = [
  {
    title: "Customer Service",
    links: [
      { label: "Track Order", href: "/track-order" },
      { label: "My Account", href: "/account" },
      { label: "Return & Refund Policy", href: "/return-policy" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms" },
    ],
  },
]

const payments = ["Cash on Delivery", "bKash", "Nagad", "Visa", "Mastercard"]

/** Cached so the footer stays in the static shell (Cache Components). */
async function CopyrightYear() {
  "use cache"
  cacheLife("days")
  return new Date().getFullYear()
}

export async function Footer() {
  const s = await getStoreSettings()
  return (
    <footer className="mt-16 bg-blush-soft pb-16 lg:pb-0">
      <BrandDivider className="shop-container pt-10" />
      <div className="shop-container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo showTagline />
          <p className="text-sm text-muted-foreground">{siteConfig.description}</p>
          <div className="flex gap-2">
            {[
              { href: siteConfig.social.facebook, label: "Facebook", Icon: FacebookIcon },
              {
                href: siteConfig.social.instagram,
                label: "Instagram",
                Icon: InstagramIcon,
              },
              { href: siteConfig.social.youtube, label: "YouTube", Icon: YoutubeIcon },
            ].map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex size-9 items-center justify-center rounded-full border border-gold/40 bg-background text-gold-ink transition-colors hover:border-gold hover:bg-gold hover:text-espresso"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="mb-3 font-display text-lg font-bold">{col.title}</h3>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-gold-ink"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="mb-3 font-display text-lg font-bold">Contact Us</h3>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold-ink" /> {s.address}
            </li>
            <li>
              <a href={`tel:${s.phone}`} className="flex gap-2 hover:text-primary">
                <Phone className="mt-0.5 size-4 shrink-0 text-gold-ink" /> {s.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${s.email}`} className="flex gap-2 hover:text-primary">
                <Mail className="mt-0.5 size-4 shrink-0 text-gold-ink" /> {s.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-espresso">
        <div className="shop-container flex flex-col items-center justify-between gap-3 py-4 text-xs text-white/70 md:flex-row">
          <p>
            © <CopyrightYear /> {s.storeName}. All rights reserved.
          </p>
          <ul
            className="flex flex-wrap justify-center gap-1.5"
            aria-label="Payment methods"
          >
            {payments.map((p) => (
              <li
                key={p}
                className="rounded border border-gold/30 bg-white/5 px-2 py-1 font-medium text-gold-light/90"
              >
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
