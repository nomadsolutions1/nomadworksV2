"use client"

import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Truck, Plus, Mail, Phone, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Supplier } from "@/lib/actions/inventory"

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-muted-foreground">Nicht bewertet</span>
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${
            s <= rating ? "fill-warning text-warning" : "text-muted-foreground/40"
          }`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating}/5</span>
    </div>
  )
}

interface SupplierListProps {
  suppliers: Supplier[]
}

export function SupplierList({ suppliers }: SupplierListProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[{ label: "Lager & Einkauf", href: "/lager" }, { label: "Lieferanten" }]}
      />

      <PageHeader
        title="Lieferanten"
        description={`${suppliers.length} Lieferant${suppliers.length === 1 ? "" : "en"} erfasst`}
      >
        <Link href="/lager/lieferanten/neu">
          <Button className="rounded-xl h-11 font-semibold gap-2">
            <Plus className="h-4 w-4" />
            Lieferant hinzufügen
          </Button>
        </Link>
      </PageHeader>

      {suppliers.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Noch keine Lieferanten"
          description="Erfassen Sie Ihre Lieferanten für eine strukturierte Bestellverwaltung."
          action={{
            label: "Lieferant hinzufügen",
            onClick: () => router.push("/lager/lieferanten/neu"),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((supplier) => (
            <Card
              key={supplier.id}
              className="rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{supplier.name}</h3>
                    <StarRating rating={supplier.rating} />
                  </div>
                  <div className="rounded-xl bg-primary/10 p-2.5 shrink-0">
                    <Truck className="h-4 w-4 text-primary" />
                  </div>
                </div>

                <div className="space-y-2 mt-3">
                  {supplier.contact_person && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {supplier.contact_person}
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <a
                        href={`tel:${supplier.phone}`}
                        className="text-foreground hover:text-primary"
                      >
                        {supplier.phone}
                      </a>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <a
                        href={`mailto:${supplier.email}`}
                        className="text-foreground hover:text-primary truncate"
                      >
                        {supplier.email}
                      </a>
                    </div>
                  )}
                </div>

                {supplier.notes && (
                  <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                    {supplier.notes}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-border flex justify-end">
                  <Link href={`/lager/lieferanten/${supplier.id}`}>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      Bearbeiten
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
