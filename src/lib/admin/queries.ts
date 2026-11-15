"use client"

/**
 * Everything the admin panel reads/writes, typed, in one place.
 * Query keys all start with "admin" so a sign-out can drop them at once.
 */
import {
  type QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query"
import { toast } from "sonner"

import type { ShopTag } from "@/app/actions/revalidate"
import { getErrorMessage } from "@/lib/api"
import type { ShopPopup } from "@/lib/popups"
import type { PublicSettings } from "@/lib/settings-fallback"
import type { AdminRole } from "@/store/admin-auth-store"
import type {
  Order,
  OrderSource,
  OrderStatus,
  Paginated,
  PaymentMethod,
  Product,
} from "@/types"

import { adminApi, refreshShopCache } from "./admin-api"

// ───────────────────────── Types ─────────────────────────

export type RiskLevel = "blacklisted" | "risky" | "new" | "good"

export interface CustomerRisk {
  level: RiskLevel
  own: { total: number; delivered: number; returned: number; cancelled: number }
  /** null until a courier fraud-check API is connected */
  courier: { total: number; delivered: number; returned: number } | null
  successRate: number | null
  blacklistReason?: string
}

export interface AdminOrder extends Order {
  source: OrderSource
  couponCode?: string
  updatedAt: string
  risk: CustomerRisk
}

export interface AdminVariant {
  id: string
  sku: string
  color: string | null
  size: string | null
  price: number | null
  comparePrice: number | null
  stock: number
}

export interface AdminProduct extends Omit<Product, "variants" | "costPrice"> {
  costPrice: number | null
  soldCount: number
  updatedAt: string
  variants: AdminVariant[]
}

export interface ProductInput {
  name: string
  slug: string
  description: string
  categoryId: string
  brand?: string | null
  price: number
  comparePrice?: number | null
  costPrice?: number | null
  stock: number
  variants: {
    id?: string
    color?: string | null
    size?: string | null
    stock: number
  }[]
  images: { url: string; alt?: string | null }[]
  status: "ACTIVE" | "HIDDEN" | "DRAFT"
  isFeatured: boolean
  isNew: boolean
  metaTitle?: string | null
  metaDescription?: string | null
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
  image: string | null
  parentId: string | null
  sortOrder: number
  active: boolean
  productCount: number
}

export interface AdminBanner {
  id: string
  title: string
  subtitle: string | null
  cta: string | null
  href: string | null
  image: string
  active: boolean
  sortOrder: number
}

export interface AdminPopup extends ShopPopup {
  name: string
  active: boolean
  views: number
  clicks: number
  createdAt: string
  updatedAt: string
}

export type PopupInput = Omit<
  AdminPopup,
  "id" | "views" | "clicks" | "createdAt" | "updatedAt"
>

export interface AdminCoupon {
  code: string
  description: string
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING"
  value: number
  minSubtotal: number | null
  maxDiscount: number | null
  usageLimit: number | null
  usedCount: number
  active: boolean
  expiresAt: string | null
}

export interface StoreSettings extends PublicSettings {
  courierCharge: { insideDhaka: number; outsideDhaka: number }
  newOrderSound: boolean
}

export interface AdminReview {
  id: string
  productId: string
  productName: string
  productSlug: string
  name: string
  phone?: string
  rating: number
  text: string
  status: "pending" | "approved" | "hidden"
  verified: boolean
  reply?: string
  createdAt: string
}

export interface LeadItem {
  productId: string
  variantId: string | null
  name: string
  slug: string
  image: string | null
  color: string | null
  size: string | null
  price: number
  quantity: number
}

export interface Lead {
  id: string
  phone: string
  fullName: string
  division: string
  district: string
  upazila: string
  address: string
  items: LeadItem[]
  subtotal: number
  status: "open" | "called" | "converted" | "dismissed"
  orderId?: string
  createdAt: string
  updatedAt: string
  callNotes: { at: string; note: string; by?: string }[]
}

export interface CustomerRow {
  id: string
  phone: string
  name: string
  district: string
  tags: string[]
  orders: number
  spent: number
  lastOrder: string
}

export interface CustomerDetail {
  phone: string
  name: string
  email?: string
  tags: string[]
  notes: { id: string; text: string; by: string; at: string }[]
  stats: {
    orders: number
    delivered: number
    returned: number
    cancelled: number
    spent: number
    averageOrder: number
    firstOrder?: string
    lastOrder?: string
  }
  risk: CustomerRisk
  blacklist: { reason: string; at: string } | null
  addresses: string[]
  bought: { name: string; qty: number }[]
  orders: Omit<AdminOrder, "risk">[]
  reviews: {
    id: string
    rating: number
    text: string
    status: string
    createdAt: string
  }[]
}

export interface Expense {
  id: string
  date: string
  category: string
  amount: number
  note?: string
}

export interface Supplier {
  id: string
  name: string
  phone: string | null
  address: string | null
  note: string | null
  purchases: number
  bought: number
  due: number
}

export interface Purchase {
  id: string
  date: string
  supplierId: string
  supplier?: { id: string; name: string }
  total: number
  paid: number
  note: string | null
  lines: {
    id: string
    productId: string
    variantId: string | null
    name: string
    variant: string | null
    quantity: number
    unitCost: number
  }[]
}

export interface SupplierLedger {
  supplier: Omit<Supplier, "purchases" | "bought" | "due">
  bought: number
  paid: number
  due: number
  purchases: Purchase[]
  payments: { id: string; date: string; amount: number; note: string | null }[]
}

export interface Dashboard {
  todayRevenue: number
  todayOrders: number
  pending: number
  monthRevenue: number
  customers: number
  incompleteOrders: number
  pendingReviews: number
  revenueSeries: { date: string; revenue: number; orders: number }[]
  statusBreakdown: Partial<Record<OrderStatus, number>>
  lowStock: { id: string; name: string; stock: number; image?: string }[]
  recentOrders: {
    id: string
    orderNumber: string
    shipName: string
    total: number
    status: OrderStatus
    createdAt: string
  }[]
}

export interface ProfitLoss {
  orders: number
  delivered: number
  returned: number
  cancelled: number
  inPipeline: number
  pipelineValue: number
  returnRate: number
  revenue: number
  productCost: number
  estimatedCost: boolean
  courierCost: number
  grossProfit: number
  refunds: number
  expenses: number
  expenseByCategory: Record<string, number>
  netProfit: number
  margin: number
}

export interface BreakdownRow {
  key: string
  label: string
  orders: number
  qty: number
  revenue: number
  profit: number
}

export interface CourierSummary {
  totalDue: number
  inTransit: number
  byCourier: {
    courier: string
    due: number
    dueParcels: number
    inTransit: number
    inTransitParcels: number
    returned: number
  }[]
}

export interface ActivityEntry {
  id: string
  at: string
  actor: string
  action: string
  message: string
  href?: string
}

export interface StaffMember {
  id: string
  name: string
  email: string
  role: AdminRole
  active: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface AdminOrderInput {
  source: OrderSource
  items: {
    productId: string
    variantId?: string | null
    quantity: number
    price?: number | null
  }[]
  shippingAddress: {
    fullName: string
    phone: string
    division: string
    district: string
    upazila: string
    address: string
  }
  paymentMethod: PaymentMethod
  deliveryCharge?: number | null
  discount: number
  note?: string | null
  adminNote?: string | null
  advance?: { amount: number; method: "bkash" | "nagad"; trxId: string } | null
  status?: "pending" | "confirmed"
  leadId?: string | null
}

type Params = Record<string, string | number | boolean | undefined | null>

/** Drops empty params so the API sees clean query strings */
const clean = (p: Params = {}) =>
  Object.fromEntries(
    Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== "")
  )

const get = <T>(url: string, params?: Params) =>
  adminApi.get<T>(url, { params: clean(params) }).then((r) => r.data)
const send = <T>(
  method: "post" | "put" | "patch" | "delete",
  url: string,
  body?: unknown
) => adminApi.request<T>({ method, url, data: body }).then((r) => r.data)

// ───────────────────────── API ─────────────────────────

export const adminQueries = {
  dashboard: () => get<Dashboard>("/dashboard"),

  orders: (p: Params) => get<Paginated<AdminOrder>>("/orders", p),
  orderCounts: () => get<Record<string, number>>("/orders/counts"),
  order: (id: string) => get<AdminOrder>(`/orders/${id}`),

  products: (p: Params) => get<Paginated<AdminProduct>>("/products", p),
  product: (id: string) => get<AdminProduct>(`/products/${id}`),
  categories: () => get<AdminCategory[]>("/categories"),
  banners: () => get<AdminBanner[]>("/banners"),
  popups: () => get<AdminPopup[]>("/popups"),
  coupons: () => get<AdminCoupon[]>("/coupons"),
  settings: () => get<StoreSettings>("/settings"),

  reviews: (p: Params) =>
    get<Paginated<AdminReview> & { counts: Record<string, number> }>("/reviews", p),
  leads: (p: Params) =>
    get<Paginated<Lead> & { summary: { waiting: number; value: number } }>(
      "/incomplete-orders",
      p
    ),
  lead: (id: string) => get<Lead>(`/incomplete-orders/${id}`),
  customers: (p: Params) => get<Paginated<CustomerRow>>("/customers", p),
  customer: (phone: string) => get<CustomerDetail>(`/customers/${phone}`),
  blacklist: () =>
    get<{ phone: string; reason: string; createdBy: string | null; createdAt: string }[]>(
      "/blacklist"
    ),

  expenses: (p: Params) =>
    get<{ categories: string[]; total: number; data: Expense[] }>("/expenses", p),
  suppliers: () => get<Supplier[]>("/suppliers"),
  supplier: (id: string) => get<SupplierLedger>(`/suppliers/${id}`),
  purchases: (p: Params) => get<Paginated<Purchase>>("/purchases", p),

  profitLoss: (p: Params) => get<ProfitLoss>("/reports/profit-loss", p),
  breakdown: (p: Params) => get<BreakdownRow[]>("/reports/breakdown", p),
  courier: () => get<CourierSummary>("/reports/courier"),
  activity: (p: Params) => get<Paginated<ActivityEntry>>("/activity", p),
  staff: () => get<StaffMember[]>("/staff"),
}

export const adminActions = {
  // Orders
  createOrder: (body: AdminOrderInput) => send<AdminOrder>("post", "/orders", body),
  editOrder: (id: string, body: AdminOrderInput) =>
    send<AdminOrder>("put", `/orders/${id}`, body),
  setStatus: (
    id: string,
    body: { status: OrderStatus; note?: string; restock?: boolean }
  ) => send<AdminOrder>("post", `/orders/${id}/status`, body),
  bulkStatus: (ids: string[], status: OrderStatus) =>
    send<{ done: string[]; failed: { id: string; error: string }[] }>(
      "post",
      "/orders/bulk/status",
      { ids, status }
    ),
  logCall: (id: string, body: { result: string; note?: string }) =>
    send<AdminOrder>("post", `/orders/${id}/calls`, body),
  setNote: (id: string, adminNote: string) =>
    send<AdminOrder>("patch", `/orders/${id}/note`, { adminNote }),
  verifyAdvance: (id: string, verified: boolean) =>
    send<AdminOrder>("post", `/orders/${id}/advance`, { verified }),
  processReturn: (
    id: string,
    body: { reason: string; restock: boolean; refundAmount: number; refundMethod: string }
  ) => send<AdminOrder>("post", `/orders/${id}/return`, body),
  bookCourier: (ids: string[], courier: string) =>
    send<{ booked: string[]; skipped: { id: string; error: string }[] }>(
      "post",
      "/orders/bulk/courier",
      { ids, courier }
    ),
  settle: (ids: string[], settled = true) =>
    send<{ updated: number }>("post", "/orders/bulk/settle", { ids, settled }),

  // Blacklist
  blacklist: (phone: string, reason: string) =>
    send("post", "/blacklist", { phone, reason }),
  unblacklist: (phone: string) => send("delete", `/blacklist/${phone}`),

  // Catalog
  createProduct: (body: ProductInput) => send<AdminProduct>("post", "/products", body),
  updateProduct: (id: string, body: ProductInput) =>
    send<AdminProduct>("put", `/products/${id}`, body),
  deleteProduct: (id: string) => send("delete", `/products/${id}`),
  saveCategory: (id: string | null, body: Omit<AdminCategory, "id" | "productCount">) =>
    id ? send("put", `/categories/${id}`, body) : send("post", "/categories", body),
  deleteCategory: (id: string) => send("delete", `/categories/${id}`),
  saveBanner: (id: string | null, body: Omit<AdminBanner, "id" | "sortOrder">) =>
    id ? send("put", `/banners/${id}`, body) : send("post", "/banners", body),
  deleteBanner: (id: string) => send("delete", `/banners/${id}`),

  // Campaign popups
  savePopup: (id: string | null, body: PopupInput) =>
    id
      ? send<AdminPopup>("put", `/popups/${id}`, body)
      : send<AdminPopup>("post", "/popups", body),
  setPopupActive: (id: string, active: boolean) =>
    send<AdminPopup>("patch", `/popups/${id}/active`, { active }),
  duplicatePopup: (id: string) => send<AdminPopup>("post", `/popups/${id}/duplicate`),
  resetPopupStats: (id: string) => send<AdminPopup>("post", `/popups/${id}/reset-stats`),
  deletePopup: (id: string) => send("delete", `/popups/${id}`),
  reorderBanners: (ids: string[]) => send("patch", "/banners/order", { ids }),
  saveCoupon: (existing: boolean, body: Omit<AdminCoupon, "usedCount">) =>
    existing
      ? send("put", `/coupons/${body.code}`, body)
      : send("post", "/coupons", body),
  deleteCoupon: (code: string) => send("delete", `/coupons/${code}`),
  saveSettings: (body: StoreSettings) => send<StoreSettings>("put", "/settings", body),

  // Reviews & leads
  reviewStatus: (ids: string[], status: AdminReview["status"]) =>
    send("post", "/reviews/status", { ids, status }),
  reviewReply: (id: string, reply: string) =>
    send("patch", `/reviews/${id}/reply`, { reply }),
  deleteReviews: (ids: string[]) => send("delete", "/reviews", { ids }),
  leadNote: (id: string, note: string) =>
    send("post", `/incomplete-orders/${id}/notes`, { note }),
  leadStatus: (id: string, status: "open" | "dismissed") =>
    send("patch", `/incomplete-orders/${id}/status`, { status }),
  deleteLead: (id: string) => send("delete", `/incomplete-orders/${id}`),

  // Customers
  customerTags: (phone: string, tags: string[]) =>
    send("put", `/customers/${phone}/tags`, { tags }),
  customerNote: (phone: string, text: string) =>
    send("post", `/customers/${phone}/notes`, { text }),
  deleteCustomerNote: (phone: string, noteId: string) =>
    send("delete", `/customers/${phone}/notes/${noteId}`),

  // Accounts
  addExpense: (body: Omit<Expense, "id">) => send<Expense>("post", "/expenses", body),
  deleteExpense: (id: string) => send("delete", `/expenses/${id}`),
  addSupplier: (body: { name: string; phone?: string; address?: string }) =>
    send<Supplier>("post", "/suppliers", body),
  deleteSupplier: (id: string) => send("delete", `/suppliers/${id}`),
  addSupplierPayment: (
    id: string,
    body: { date: string; amount: number; note?: string }
  ) => send("post", `/suppliers/${id}/payments`, body),
  addPurchase: (body: {
    date: string
    supplierId: string
    lines: {
      productId: string
      variantId?: string | null
      quantity: number
      unitCost: number
    }[]
    paid: number
    note?: string
    updateCost: boolean
  }) => send<Purchase>("post", "/purchases", body),
  deletePurchase: (id: string) => send("delete", `/purchases/${id}`),

  // Staff
  addStaff: (body: { name: string; email: string; role: AdminRole; password: string }) =>
    send<StaffMember>("post", "/staff", body),
  updateStaff: (
    id: string,
    body: Partial<{ name: string; role: AdminRole; active: boolean; password: string }>
  ) => send<StaffMember>("patch", `/staff/${id}`, body),
}

// ───────────────────────── Hooks ─────────────────────────

/** `useQuery` with the "admin" key prefix */
export function useAdminQuery<T>(
  key: QueryKey,
  fn: () => Promise<T>,
  options: Omit<UseQueryOptions<T>, "queryKey" | "queryFn"> = {}
) {
  return useQuery<T>({
    queryKey: ["admin", ...key],
    queryFn: fn,
    staleTime: 15_000,
    ...options,
  })
}

/**
 * A write that toasts its result, refetches the listed admin queries and,
 * when it changes what customers see, refreshes the shop's cache.
 */
export function useAdminMutation<TVars, TResult>(
  fn: (vars: TVars) => Promise<TResult>,
  opts: {
    /** Query key prefixes (without "admin") to refetch afterwards */
    invalidate?: QueryKey[]
    success?: string | ((result: TResult, vars: TVars) => string | undefined)
    shop?: ShopTag[]
    onSuccess?: (result: TResult, vars: TVars) => void
  } = {}
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: async (result, vars) => {
      const msg =
        typeof opts.success === "function" ? opts.success(result, vars) : opts.success
      if (msg) toast.success(msg)
      opts.onSuccess?.(result, vars)
      await Promise.all(
        (opts.invalidate ?? []).map((k) =>
          qc.invalidateQueries({ queryKey: ["admin", ...k] })
        )
      )
      if (opts.shop?.length) void refreshShopCache(opts.shop)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}
