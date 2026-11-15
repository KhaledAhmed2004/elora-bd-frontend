export interface Testimonial {
  id: string
  name: string
  location: string
  rating: number
  text: string
  product: string
}

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Nusrat Jahan",
    location: "Mirpur, Dhaka",
    rating: 5,
    text: "The Jamdani is just as beautiful as in the photos, and the fabric quality is excellent. Delivered within 2 days.",
    product: "Dhakai Jamdani Silk Saree",
  },
  {
    id: "t2",
    name: "Farzana Akter",
    location: "Chattogram",
    rating: 5,
    text: "The stitching and fit of the three piece are perfect. With Cash on Delivery I could check it before paying.",
    product: "Embroidered White Three Piece",
  },
  {
    id: "t3",
    name: "Sadia Islam",
    location: "Sylhet",
    rating: 4,
    text: "The party gown is very elegant. I needed a size exchange and they handled it without any hassle.",
    product: "Red Flowy Party Gown",
  },
]
