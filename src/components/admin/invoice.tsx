"use client"

import { formatDate, formatPhone, formatPrice, toBanglaDigits } from "@/lib/format"
import { FALLBACK_SETTINGS } from "@/lib/settings-fallback"
import { adminQueries, useAdminQuery } from "@/lib/admin/queries"
import { codDue } from "@/lib/orders"
import { variantLabel } from "@/lib/variants"
import type { Order } from "@/types"

import { PAYMENT_LABEL } from "./admin-ui"

const TEXT = {
  en: {
    invoice: "INVOICE",
    shipTo: "Ship to",
    payment: "Payment",
    paid: "PAID",
    unpaid: "UNPAID",
    product: "Product",
    price: "Price",
    qty: "Qty",
    total: "Total",
    subtotal: "Subtotal",
    discount: "Discount",
    delivery: "Delivery",
    advance: "Advance",
    cod: "COD Amount",
    thanks: (shop: string) =>
      `Thank you for shopping with ${shop}! · Exchange available within 7 days`,
  },
  bn: {
    invoice: "ইনভয়েস",
    shipTo: "প্রাপক",
    payment: "পেমেন্ট",
    paid: "পরিশোধিত",
    unpaid: "অপরিশোধিত",
    product: "পণ্য",
    price: "দাম",
    qty: "পরিমাণ",
    total: "মোট",
    subtotal: "সাবটোটাল",
    discount: "ছাড়",
    delivery: "ডেলিভারি চার্জ",
    advance: "অগ্রিম",
    cod: "ক্যাশ অন ডেলিভারি",
    thanks: (shop: string) =>
      `${shop} থেকে কেনাকাটার জন্য ধন্যবাদ! · ৭ দিনের মধ্যে এক্সচেঞ্জ করা যাবে`,
  },
}

const PAYMENT_BN: Record<Order["paymentMethod"], string> = {
  cod: "ক্যাশ অন ডেলিভারি",
  bkash: "বিকাশ",
  nagad: "নগদ",
  sslcommerz: "কার্ড",
}

/** Printable invoice (plain styles so it prints cleanly on A4/A5). */
export function Invoice({ order }: { order: Order }) {
  const { data } = useAdminQuery(["settings"], adminQueries.settings)
  const settings = data ?? FALLBACK_SETTINGS
  const lang = settings.invoiceLang
  const t = TEXT[lang]
  const bn = lang === "bn"
  const money = (n: number) => formatPrice(n, lang)
  const num = (n: number | string) => (bn ? toBanglaDigits(n) : String(n))
  const a = order.shippingAddress

  return (
    <div lang={lang} className="bg-white p-8 text-sm text-black">
      <div className="flex items-start justify-between border-b-2 border-black pb-4">
        <div>
          <p className="text-2xl font-bold">{settings.storeName}</p>
          <p>{settings.address}</p>
          <p>
            {settings.phone} · {settings.email}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">{t.invoice}</p>
          <p>{order.orderNumber}</p>
          <p>{formatDate(order.createdAt, lang)}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="font-bold">{t.shipTo}</p>
          <p>{a.fullName}</p>
          <p>{formatPhone(a.phone)}</p>
          <p>
            {a.address}, {a.upazila}, {a.district}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold">{t.payment}</p>
          <p>
            {bn ? PAYMENT_BN[order.paymentMethod] : PAYMENT_LABEL[order.paymentMethod]}
          </p>
          <p>{order.paymentStatus === "paid" ? t.paid : t.unpaid}</p>
          {order.courier && (
            <p>
              {order.courier.name}: {order.courier.trackingId}
            </p>
          )}
        </div>
      </div>

      <table className="mt-6 w-full border-collapse">
        <thead>
          <tr className="border-y border-black text-left">
            <th className="py-2">#</th>
            <th className="py-2">{t.product}</th>
            <th className="py-2 text-right">{t.price}</th>
            <th className="py-2 text-right">{t.qty}</th>
            <th className="py-2 text-right">{t.total}</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((it, i) => (
            <tr key={i} className="border-b border-gray-300">
              <td className="py-2">{num(i + 1)}</td>
              <td className="py-2">
                {it.name}
                {it.attributes &&
                  Object.keys(it.attributes).length > 0 &&
                  ` (${variantLabel(it.attributes, { sep: ", ", lang })})`}
              </td>
              <td className="py-2 text-right">{money(it.price)}</td>
              <td className="py-2 text-right">{num(it.quantity)}</td>
              <td className="py-2 text-right">{money(it.price * it.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ml-auto w-64 space-y-1">
        <Row label={t.subtotal} value={money(order.subtotal)} />
        {order.discount > 0 && (
          <Row label={t.discount} value={`-${money(order.discount)}`} />
        )}
        <Row label={t.delivery} value={money(order.deliveryCharge)} />
        <div className="flex justify-between border-t-2 border-black pt-1 text-base font-bold">
          <span>{t.total}</span>
          <span>{money(order.total)}</span>
        </div>
        {order.advance && (
          <Row
            label={`${t.advance} (${bn ? PAYMENT_BN[order.advance.method] : order.advance.method})`}
            value={`-${money(order.advance.amount)}`}
          />
        )}
        <div className="flex justify-between border-2 border-black px-2 py-1 text-base font-bold">
          <span>{t.cod}</span>
          <span>{money(codDue(order))}</span>
        </div>
      </div>

      <p className="mt-10 text-center text-xs">{t.thanks(settings.storeName)}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
