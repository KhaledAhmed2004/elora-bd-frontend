/**
 * Marketing event helpers — Facebook Pixel + GA4 (via GTM dataLayer).
 * Call these from product page, cart, checkout.
 */
type FbqFn = (...args: unknown[]) => void

declare global {
  interface Window {
    fbq?: FbqFn
    dataLayer?: Record<string, unknown>[]
  }
}

interface EcomItem {
  id: string
  name: string
  price: number
  quantity?: number
}

function fbTrack(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq) window.fbq("track", event, params)
}

function gtmPush(event: string, data: Record<string, unknown>) {
  if (typeof window === "undefined") return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push({ ecommerce: null }) // clear previous ecommerce object
  window.dataLayer.push({ event, ...data })
}

const toGaItems = (items: EcomItem[]) =>
  items.map((i) => ({
    item_id: i.id,
    item_name: i.name,
    price: i.price,
    quantity: i.quantity ?? 1,
  }))

const total = (items: EcomItem[]) =>
  items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0)

export const analytics = {
  /** GA4 recommended promotion events, for campaign popups */
  promotionView(id: string, name: string) {
    gtmPush("view_promotion", {
      ecommerce: { promotion_id: id, promotion_name: name, creative_slot: "popup" },
    })
  },
  promotionClick(id: string, name: string) {
    gtmPush("select_promotion", {
      ecommerce: { promotion_id: id, promotion_name: name, creative_slot: "popup" },
    })
  },
  viewContent(item: EcomItem) {
    fbTrack("ViewContent", {
      content_ids: [item.id],
      content_name: item.name,
      content_type: "product",
      value: item.price,
      currency: "BDT",
    })
    gtmPush("view_item", {
      ecommerce: { currency: "BDT", value: item.price, items: toGaItems([item]) },
    })
  },
  addToCart(item: EcomItem) {
    fbTrack("AddToCart", {
      content_ids: [item.id],
      content_type: "product",
      value: total([item]),
      currency: "BDT",
    })
    gtmPush("add_to_cart", {
      ecommerce: { currency: "BDT", value: total([item]), items: toGaItems([item]) },
    })
  },
  initiateCheckout(items: EcomItem[]) {
    fbTrack("InitiateCheckout", {
      content_ids: items.map((i) => i.id),
      num_items: items.length,
      value: total(items),
      currency: "BDT",
    })
    gtmPush("begin_checkout", {
      ecommerce: { currency: "BDT", value: total(items), items: toGaItems(items) },
    })
  },
  purchase(orderId: string, items: EcomItem[], value: number) {
    // eventID lets the backend Conversions API dedupe this event
    window.fbq?.(
      "track",
      "Purchase",
      { content_ids: items.map((i) => i.id), value, currency: "BDT" },
      { eventID: orderId }
    )
    gtmPush("purchase", {
      ecommerce: {
        transaction_id: orderId,
        currency: "BDT",
        value,
        items: toGaItems(items),
      },
    })
  },
  search(query: string) {
    fbTrack("Search", { search_string: query })
    gtmPush("search", { search_term: query })
  },
}
