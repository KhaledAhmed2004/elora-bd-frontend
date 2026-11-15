export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Elora BD",
  slogan: "Your Style, Your Identity. ♡",
  tagline: "Fashion & Lifestyle",
  description:
    "Elora BD — a trusted online shop for women's fashion — Saree, Three Piece, Kurti, Dress, Bags, Footwear and Jewelry. Cash on Delivery nationwide.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "bn_BD",
  currency: "BDT",
  contact: {
    phone: "+8801XXXXXXXXX",
    email: "support@elora-bd.com",
    whatsapp: "8801XXXXXXXXX",
    messenger: "https://m.me/elorabd",
    address: "Dhaka, Bangladesh",
  },
  social: {
    facebook: "https://facebook.com/elorabd",
    instagram: "https://instagram.com/elorabd",
    youtube: "https://youtube.com/@elorabd",
  },
  delivery: {
    insideDhaka: 60,
    outsideDhaka: 120,
    freeDeliveryMinimum: 2000,
  },
} as const

export type SiteConfig = typeof siteConfig
