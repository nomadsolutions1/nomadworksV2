"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PackageOpen } from "lucide-react"
import { formatCurrency, formatNumber } from "@/lib/utils/format"

interface OrderItem {
  position: number
  description: string
  unit: string | null
  quantity: number
  unit_price: number
  total: number
}

interface OrderItemsPreviewProps {
  items: OrderItem[]
}

export function OrderItemsPreview({ items }: OrderItemsPreviewProps) {
  if (items.length === 0) return null

  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="bg-muted px-4 py-2 flex items-center gap-2">
        <PackageOpen className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          {items.length} Auftragspositionen werden übernommen
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="w-10 text-xs">Pos.</TableHead>
            <TableHead className="text-xs">Beschreibung</TableHead>
            <TableHead className="text-right text-xs w-20">Menge</TableHead>
            <TableHead className="text-right text-xs w-24">Gesamt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.slice(0, 5).map((item) => (
            <TableRow key={item.position} className="even:bg-muted/30">
              <TableCell className="text-xs font-mono text-muted-foreground">
                {item.position}
              </TableCell>
              <TableCell className="text-xs">{item.description}</TableCell>
              <TableCell className="text-right text-xs font-mono">
                {formatNumber(item.quantity)} {item.unit}
              </TableCell>
              <TableCell className="text-right text-xs font-mono font-semibold">
                {formatCurrency(item.total)}
              </TableCell>
            </TableRow>
          ))}
          {items.length > 5 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-xs text-center text-muted-foreground py-2"
              >
                + {items.length - 5} weitere Positionen
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
