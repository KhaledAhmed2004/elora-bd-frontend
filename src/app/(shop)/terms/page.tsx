import type { Metadata } from "next"
import Link from "next/link"

import { ContentPage } from "@/components/shared/content-page"
import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms for using our website and placing orders.",
}

export default function TermsPage() {
  return (
    <ContentPage
      title="Terms & Conditions"
      intro={`By using the ${siteConfig.name} website or placing an order, you agree to the following terms.`}
      updated="9 November 2026"
    >
      <h2>Orders and confirmation</h2>
      <ul>
        <li>
          After you place an order, we call you to confirm it. Orders that are not
          confirmed will not be processed.
        </li>
        <li>
          We reserve the right to cancel an order if an item goes out of stock or is
          incorrectly priced — in that case you will be notified and any advance payment
          will be refunded.
        </li>
        <li>
          Customers who repeatedly place orders without accepting delivery (fake orders)
          may be required to pay in advance for future orders.
        </li>
      </ul>

      <h2>Pricing and payment</h2>
      <ul>
        <li>
          All prices are in Bangladeshi Taka (৳) and include VAT (where applicable).
        </li>
        <li>
          Delivery charges are shown at checkout: ৳{siteConfig.delivery.insideDhaka}{" "}
          inside Dhaka, ৳{siteConfig.delivery.outsideDhaka} outside Dhaka.
        </li>
        <li>Payment: Cash on Delivery, bKash, Nagad, card or online banking.</li>
      </ul>

      <h2>Delivery</h2>
      <ul>
        <li>1-2 days inside Dhaka, 3-5 working days outside Dhaka.</li>
        <li>Delays may occur due to natural disasters, hartals or courier issues.</li>
      </ul>

      <h2>Product colors and sizes</h2>
      <p>
        Product colors may look slightly different from the photos depending on your
        screen. Please check the Size Guide before ordering.
      </p>

      <h2>Returns and refunds</h2>
      <p>
        For details, see our <Link href="/return-policy">Return & Refund Policy</Link>.
      </p>

      <h2>Account</h2>
      <p>
        Never share your account OTP with anyone. If you notice any suspicious activity on
        your account, let us know immediately.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of the People&apos;s Republic of Bangladesh.
        Any disputes shall fall under the jurisdiction of the courts of Dhaka.
      </p>
    </ContentPage>
  )
}
