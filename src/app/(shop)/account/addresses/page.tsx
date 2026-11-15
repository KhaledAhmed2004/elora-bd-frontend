import type { Metadata } from "next"

import { AddressesView } from "@/components/account/addresses-view"

export const metadata: Metadata = { title: "Address Book" }

export default function AddressesPage() {
  return <AddressesView />
}
