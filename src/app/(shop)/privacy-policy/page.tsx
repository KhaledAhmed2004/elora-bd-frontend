import type { Metadata } from "next"

import { ContentPage } from "@/components/shared/content-page"
import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What information we collect and how we use it.",
}

export default function PrivacyPolicyPage() {
  const { email, phone, address } = siteConfig.contact
  return (
    <ContentPage
      title="Privacy Policy"
      intro={`${siteConfig.name} is committed to keeping your personal information safe.`}
      updated="9 November 2026"
    >
      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Order information:</strong> name, mobile number, delivery address and
          (optionally) email
        </li>
        <li>
          <strong>Account:</strong> mobile number (for OTP login), name and saved
          addresses
        </li>
        <li>
          <strong>Payment:</strong> we never store card details or bKash/Nagad
          PINs/passwords. Online payments are processed through secure payment gateways
          (such as bKash, Nagad and SSLCommerz).
        </li>
        <li>
          <strong>Website usage:</strong> browser, device and pages visited — collected
          through cookies and analytics
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To process orders, make confirmation calls and deliver your products</li>
        <li>To send order updates by SMS or phone call</li>
        <li>To prevent fake orders and fraud</li>
        <li>To improve our website and services</li>
        <li>To send you offers and news about new collections, if you have opted in</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>We never sell your information. We share it only when necessary with:</p>
      <ul>
        <li>Courier companies (name, phone and address — for delivery)</li>
        <li>Payment gateways (for online payments)</li>
        <li>SMS providers (for OTPs and order updates)</li>
        <li>Government authorities, when required by law</li>
      </ul>

      <h2>Cookies and Analytics</h2>
      <p>
        We use cookies, Google Analytics and Facebook Pixel to keep the website running
        properly and to improve it. You can disable cookies in your browser settings,
        but some features (such as the cart) may not work.
      </p>

      <h2>Data security</h2>
      <p>
        Our website is secured with HTTPS (SSL). Only authorized staff can access your
        information.
      </p>

      <h2>Your rights</h2>
      <p>
        You may ask to view or correct your information, or to delete your account, at
        any time. To do so, please contact us.
      </p>

      <h2>Contact</h2>
      <p>
        {siteConfig.name}, {address}
        <br />
        Phone: <a href={`tel:${phone}`}>{phone}</a> · Email:{" "}
        <a href={`mailto:${email}`}>{email}</a>
      </p>
    </ContentPage>
  )
}
