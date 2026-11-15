export type ID = string

export interface Image {
  url: string
  alt?: string
}

export interface Category {
  id: ID
  name: string
  slug: string
  image?: string
  parentId?: ID | null
  children?: Category[]
}

export interface Brand {
  id: ID
  name: string
  slug: string
  logo?: string
}

export interface ProductVariant {
  id: ID
  sku: string
  /** e.g. { size: "M", color: "Black" } */
  attributes: Record<string, string>
  price: number
  comparePrice?: number | null
  stock: number
}

export interface Product {
  id: ID
  name: string
  slug: string
  description: string
  shortDescription?: string
  images: Image[]
  price: number
  /** Original price before discount (shown crossed out) */
  comparePrice?: number | null
  stock: number
  category: Pick<Category, "id" | "name" | "slug">
  brand?: Pick<Brand, "id" | "name" | "slug"> | null
  variants?: ProductVariant[]
  rating?: number
  reviewCount?: number
  isFeatured?: boolean
  isNew?: boolean
  createdAt: string
  /** Purchase cost (admin only) — used for profit reports */
  costPrice?: number
  /** active = in shop; hidden = only via direct link; draft = not visible. Missing = active */
  status?: ProductStatus
  /** SEO overrides (fall back to name / generated description) */
  metaTitle?: string
  metaDescription?: string
}

export type ProductStatus = "active" | "hidden" | "draft"

export interface CartItem {
  /** productId + variantId — unique per line */
  key: string
  productId: ID
  variantId?: ID | null
  name: string
  slug: string
  image: string
  price: number
  quantity: number
  maxStock: number
  attributes?: Record<string, string>
}

export interface ShippingAddress {
  fullName: string
  phone: string
  division: string
  district: string
  upazila: string
  address: string
}

export type PaymentMethod = "cod" | "bkash" | "nagad" | "sslcommerz"

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned"

export interface OrderItem {
  /** null when the product was deleted later */
  productId: ID | null
  variantId?: ID | null
  name: string
  image: string
  price: number
  quantity: number
  attributes?: Record<string, string>
  /** Cost per unit at the time of the order (for profit) */
  costPrice?: number
}

export type OrderSource = "website" | "facebook" | "whatsapp" | "phone" | "instagram"

export type CallResult = "confirmed" | "no-answer" | "busy" | "callback" | "cancelled"

export interface CallLog {
  at: string
  result: CallResult
  note?: string
  /** Staff member who called */
  by?: string
}

export interface AdvancePayment {
  amount: number
  method: "bkash" | "nagad"
  trxId: string
  senderNumber?: string
  verified: boolean
}

export interface CourierInfo {
  name: string
  trackingId: string
  /** What the courier charges us for this parcel */
  charge?: number
  /** COD money received from the courier */
  settled?: boolean
  settledAt?: string
}

export interface Order {
  id: ID
  orderNumber: string
  items: OrderItem[]
  shippingAddress: ShippingAddress
  paymentMethod: PaymentMethod
  paymentStatus: "unpaid" | "paid" | "refunded"
  status: OrderStatus
  subtotal: number
  deliveryCharge: number
  discount: number
  total: number
  note?: string
  createdAt: string
  /** Status timeline (admin changes) */
  history?: { status: OrderStatus; at: string; note?: string; by?: string }[]
  courier?: CourierInfo | null
  /** Where the order came from (manual orders from Facebook etc.) */
  source?: OrderSource
  callLog?: CallLog[]
  cancelReason?: string
  advance?: AdvancePayment | null
  /** Internal note, never shown to the customer */
  adminNote?: string
  /** True once stock was taken out for this order (so cancel/return can restock) */
  stockDeducted?: boolean
  refund?: { amount: number; method: string; at: string } | null
}

export interface User {
  id: ID
  name: string
  phone: string
  email?: string | null
  role: "customer" | "admin" | "staff"
}

export interface Paginated<T> {
  data: T[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export interface ApiError {
  message: string
  statusCode: number
  errors?: Record<string, string[]>
}
