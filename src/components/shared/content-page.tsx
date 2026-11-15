import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { cn } from "@/lib/utils"

interface ContentPageProps {
  title: string
  intro?: string
  updated?: string
  children: React.ReactNode
  className?: string
}

/** Simple long-form text page (policies, about). Styles plain h2/p/ul children. */
export function ContentPage({
  title,
  intro,
  updated,
  children,
  className,
}: ContentPageProps) {
  return (
    <div className="shop-container py-6">
      <Breadcrumbs items={[{ label: title }]} />
      <article className={cn("mx-auto max-w-3xl", className)}>
        <header className="mb-8 border-b pb-6">
          <h1 className="font-display text-3xl font-bold md:text-4xl">{title}</h1>
          {intro && <p className="mt-3 text-lg text-muted-foreground">{intro}</p>}
          {updated && (
            <p className="mt-3 text-sm text-muted-foreground">
              Shorbshesh update: {updated}
            </p>
          )}
        </header>
        <div className="leading-relaxed text-foreground/90 [&_a]:text-primary [&_a]:underline [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2:first-child]:mt-0 [&_li]:mt-1.5 [&_p]:mt-3 [&_strong]:text-foreground [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </div>
  )
}
