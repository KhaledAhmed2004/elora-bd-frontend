import { unsplash } from "./images"

export interface Banner {
  id: string
  title: string
  subtitle: string
  cta: string
  href: string
  image: string
}

export const heroBanners: Banner[] = [
  {
    id: "b-elora",
    title: "Your Style, Your Identity.",
    subtitle:
      "Elora Fashion & Lifestyle — Saree, Party Gown, Bags, Footwear & Exclusive Jewelry",
    cta: "Shop the Collection",
    href: "/products",
    image: "/brand/elora-store-interior.jpg",
  },
  {
    id: "b1",
    title: "Eid Collection 2026",
    subtitle: "New Sarees, Three Pieces & Party Gowns — up to 40% off",
    cta: "Buy Now",
    href: "/category/saree",
    image: unsplash("1617627143750-d86bc21e42bb", 1600),
  },
  {
    id: "b2",
    title: "Party Dress Festival",
    subtitle: "Special offers on gowns and western dresses",
    cta: "View Offers",
    href: "/category/dresses",
    image: unsplash("1595777457583-95e059d581b8", 1600),
  },
  {
    id: "b3",
    title: "Free Delivery Nationwide",
    subtitle: "Free delivery on orders over ৳2,000",
    cta: "Shop Now",
    href: "/products",
    image: unsplash("1483985988355-763728e1935b", 1600),
  },
]
