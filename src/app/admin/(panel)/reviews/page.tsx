import type { Metadata } from "next"

import { ReviewsView } from "@/components/admin/reviews-view"

/** Client-rendered behind the admin sign-in: nothing to pre-validate */
export const instant = false

export const metadata: Metadata = { title: "Reviews" }

export default function AdminReviewsPage() {
  return <ReviewsView />
}
