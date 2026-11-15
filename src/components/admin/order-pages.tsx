"use client"

import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { adminQueries, type Lead, useAdminQuery } from "@/lib/admin/queries"

import { PageHeader } from "./admin-ui"
import { OrderForm } from "./order-form"

/** Turn an incomplete checkout into a prefilled order draft */
function draftFromLead(lead: Lead) {
  return {
    source: "website" as const,
    items: lead.items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      name: i.name,
      image: i.image ?? "/placeholder.svg",
      price: i.price,
      quantity: i.quantity,
    })),
    shippingAddress: {
      fullName: lead.fullName,
      phone: lead.phone,
      division: lead.division,
      district: lead.district,
      upazila: lead.upazila,
      address: lead.address,
    },
    paymentMethod: "cod" as const,
    deliveryCharge: 0,
    discount: 0,
    adminNote: "From incomplete checkout",
    advance: null,
  }
}

/** Uses useSearchParams → rendered inside the admin layout's <Suspense>. */
export function NewOrderView() {
  const from = useSearchParams().get("from")
  const { data: lead, isPending } = useAdminQuery(
    ["incomplete", "one", from],
    () => adminQueries.lead(from!),
    { enabled: Boolean(from) }
  )
  if (from && isPending) return <Skeleton className="h-96 rounded-xl" />
  return (
    <div>
      <PageHeader
        title="New order"
        description={
          lead
            ? `From incomplete checkout — ${lead.fullName || lead.phone}`
            : "Add orders received via Facebook, WhatsApp or phone"
        }
      />
      <OrderForm
        // Remount per lead: this page stays mounted (hidden) between visits
        key={lead?.id ?? "blank"}
        draft={lead ? draftFromLead(lead) : undefined}
        leadId={lead?.id}
      />
    </div>
  )
}

/** Uses useParams → rendered inside the admin layout's <Suspense>. */
export function EditOrderView() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isPending } = useAdminQuery(["orders", "detail", id], () =>
    adminQueries.order(id)
  )
  if (isPending) return <Skeleton className="h-96 rounded-xl" />
  if (!order) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="font-semibold">Order not found</p>
        <Button asChild variant="outline">
          <Link href="/admin/orders">Back to orders</Link>
        </Button>
      </div>
    )
  }
  return (
    <div>
      <PageHeader title={`Edit order — ${order.orderNumber}`} />
      <OrderForm key={order.updatedAt} order={order} />
    </div>
  )
}
