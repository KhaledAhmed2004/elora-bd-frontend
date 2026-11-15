import { Clock, Mail, MapPin, Phone } from "lucide-react"
import type { Metadata } from "next"

import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { ContactForm } from "@/components/shared/contact-form"
import { FacebookIcon, WhatsappIcon } from "@/components/shared/social-icons"
import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with us by phone, WhatsApp, Facebook or email.",
}

export default function ContactPage() {
  const c = siteConfig.contact
  const channels = [
    { icon: Phone, label: "Call Us", value: c.phone, href: `tel:${c.phone}` },
    {
      icon: WhatsappIcon,
      label: "WhatsApp",
      value: "Send a message",
      href: `https://wa.me/${c.whatsapp}`,
    },
    {
      icon: FacebookIcon,
      label: "Facebook Page",
      value: "Message us on Messenger",
      href: c.messenger,
    },
    { icon: Mail, label: "Email", value: c.email, href: `mailto:${c.email}` },
  ]

  return (
    <div className="shop-container py-6">
      <Breadcrumbs items={[{ label: "Contact" }]} />
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Contact Us</h1>
        <p className="mt-2 text-muted-foreground">
          Questions about an order, sizing or a product? We&apos;re here to help.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border p-5 md:p-6">
          <h2 className="mb-4 font-semibold">Send a Message</h2>
          <ContactForm />
        </section>

        <aside className="space-y-3">
          {channels.map(({ icon: Icon, label, value, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:border-primary"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block truncate text-sm text-muted-foreground">
                  {value}
                </span>
              </span>
            </a>
          ))}
          <div className="space-y-3 rounded-xl border p-4 text-sm">
            <p className="flex gap-3">
              <MapPin className="size-5 shrink-0 text-primary" /> {c.address}
            </p>
            <p className="flex gap-3">
              <Clock className="size-5 shrink-0 text-primary" /> Saturday – Thursday,
              10 AM – 9 PM
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
