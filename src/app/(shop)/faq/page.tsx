import type { Metadata } from "next"
import Link from "next/link"

import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions",
  description: "Answers to common questions about orders, delivery, payment and returns.",
}

const { insideDhaka, outsideDhaka, freeDeliveryMinimum } = siteConfig.delivery

const faqs = [
  {
    group: "Order",
    items: [
      {
        q: "How do I place an order?",
        a: "Choose a product, select your size, then tap 'Add to Cart' or 'Buy Now'. At checkout, enter your name, phone number and address, then tap 'Confirm Order'. You can order without an account too.",
      },
      {
        q: "What happens after I order?",
        a: "We'll call you within 24 hours to confirm your order. Your product is then packed and handed to the courier.",
      },
      {
        q: "Can I cancel my order?",
        a: "Yes, you can cancel free of charge any time before it is handed to the courier — just call or WhatsApp us.",
      },
    ],
  },
  {
    group: "Delivery",
    items: [
      {
        q: "How much is the delivery charge?",
        a: `৳${insideDhaka} inside Dhaka, ৳${outsideDhaka} outside Dhaka. Delivery is free on orders over ৳${freeDeliveryMinimum.toLocaleString("en-IN")}.`,
      },
      {
        q: "How long does delivery take?",
        a: "1-2 days inside Dhaka, 3-5 working days outside Dhaka.",
      },
      {
        q: "How can I check where my order is?",
        a: "Enter your order number and mobile number on the Track Order page.",
      },
    ],
  },
  {
    group: "Payment",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "Cash on Delivery (pay when you receive it), bKash, Nagad, Visa/Mastercard and online banking.",
      },
      {
        q: "Can I check the product before paying with Cash on Delivery?",
        a: "Yes. Open and check the product in front of the delivery person, then pay.",
      },
    ],
  },
  {
    group: "Return & Size",
    items: [
      {
        q: "What if the size doesn't fit?",
        a: "You can exchange it within 7 days of receiving it, as long as the product is unused and the tags are intact.",
      },
      {
        q: "How do I find my size?",
        a: "Every product page has a 'Size Guide' tab with Bust, Waist and Length measurements.",
      },
    ],
  },
]

export default function FaqPage() {
  // Google FAQ rich results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.flatMap((g) =>
      g.items.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      }))
    ),
  }

  return (
    <div className="shop-container py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Breadcrumbs items={[{ label: "FAQ" }]} />
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-bold md:text-4xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-2 text-muted-foreground">
          Can&apos;t find your answer here? Let us know.
        </p>

        <div className="mt-8 space-y-8">
          {faqs.map((g) => (
            <section key={g.group}>
              <h2 className="mb-2 font-semibold text-primary">{g.group}</h2>
              <Accordion type="single" collapsible className="rounded-xl border px-4">
                {g.items.map((f) => (
                  <AccordionItem key={f.q} value={f.q}>
                    <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl bg-accent/50 p-6 text-center">
          <p className="font-semibold">Still have questions?</p>
          <Button asChild>
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
