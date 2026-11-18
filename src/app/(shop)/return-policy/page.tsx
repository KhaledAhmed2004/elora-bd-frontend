import type { Metadata } from "next"
import Link from "next/link"

import { ContentPage } from "@/components/shared/content-page"
import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: "Return & Refund Policy",
  description: "Our 7-day easy exchange and refund policy.",
}

export default function ReturnPolicyPage() {
  const { phone, email } = siteConfig.contact
  return (
    <ContentPage
      title="Return & Refund Policy"
      intro="Your satisfaction matters most to us. If there is any problem with your product, we're here to help."
      updated="9 November 2026"
    >
      <h2>Check your order on delivery</h2>
      <p>
        For Cash on Delivery orders, open and check the product in front of the delivery
        person before paying. If the item is wrong, damaged or the wrong size,{" "}
        <strong>return it on the spot</strong> — you only pay the delivery charge.
      </p>

      <h2>7-Day Exchange</h2>
      <p>Products can be exchanged within 7 days of delivery, provided that:</p>
      <ul>
        <li>The product has not been used, washed or altered</li>
        <li>The original tags, labels and packaging are intact</li>
        <li>You can provide the invoice / order number</li>
      </ul>

      <h2>Non-returnable items</h2>
      <ul>
        <li>Jewelry and earrings (for hygiene reasons), unless damaged</li>
        <li>Items bought on offer or clearance sale (unless stated otherwise)</li>
        <li>Custom-made or altered products</li>
      </ul>

      <h2>Wrong or damaged items</h2>
      <p>
        If we made a mistake (wrong product, wrong size or damaged item), we will provide
        a <strong>free</strong> exchange or a full refund — including the delivery charge.
        Please let us know with photos within 48 hours of receiving the product.
      </p>

      <h2>How refunds work</h2>
      <ul>
        <li>Returned products are inspected once they reach our warehouse</li>
        <li>Once approved, refunds are issued within 7-10 working days</li>
        <li>
          bKash/Nagad payments are refunded to the same number; card payments to the same
          card
        </li>
        <li>Cash on Delivery orders are refunded to your bKash/Nagad or bank account</li>
      </ul>

      <h2>Order cancellation</h2>
      <p>
        You can cancel free of charge any time before the product is handed to the
        courier. Cancellations after dispatch will incur the delivery charge.
      </p>

      <h2>Contact</h2>
      <p>
        For returns or exchanges, call <a href={`tel:${phone}`}>{phone}</a>, email{" "}
        <a href={`mailto:${email}`}>{email}</a>, or send us a message from the{" "}
        <Link href="/contact">Contact page</Link>.
      </p>
    </ContentPage>
  )
}
