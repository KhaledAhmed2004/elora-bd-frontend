import { WhatsappIcon } from "@/components/shared/social-icons"
import { getStoreSettings } from "@/lib/site-settings"

export async function FloatingChat() {
  const { whatsapp } = await getStoreSettings()
  const text = encodeURIComponent("Hi, I'd like to know more about a product.")
  return (
    <a
      href={`https://wa.me/${whatsapp}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message us on WhatsApp"
      className="fixed right-3 bottom-20 z-30 flex size-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-2 ring-background transition-transform hover:scale-110 lg:right-4 lg:bottom-6 lg:size-12"
    >
      <WhatsappIcon className="size-6" />
    </a>
  )
}
