import type { InvoiceItem } from "@/lib/actions/invoices"
import { formatCurrency, formatNumber } from "@/lib/utils/format"

interface InvoicePrintItemsProps {
  items: InvoiceItem[]
  subtotal: number
  taxRate: number | null
  taxAmount: number
  total: number
}

export function InvoicePrintItems({
  items,
  subtotal,
  taxRate,
  taxAmount,
  total,
}: InvoicePrintItemsProps) {
  return (
    <>
      {/* Items table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "32px" }}>
        <thead>
          <tr style={{ backgroundColor: "#1e3a5f", color: "white" }}>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", width: "48px" }}>Pos.</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Beschreibung</th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", width: "80px" }}>Menge</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", width: "64px" }}>Einheit</th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", width: "100px" }}>EP</th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", width: "110px" }}>Gesamt</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "12px", opacity: 0.6 }}>{item.position}</td>
              <td style={{ padding: "10px 12px", fontSize: "13px" }}>{item.description}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", fontSize: "12px" }}>{formatNumber(item.quantity)}</td>
              <td style={{ padding: "10px 12px", fontSize: "12px", opacity: 0.6 }}>{item.unit || "\u2014"}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", fontSize: "12px" }}>{formatCurrency(item.unit_price)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", fontSize: "12px", fontWeight: "600" }}>{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "40px" }}>
        <table style={{ fontSize: "13px", borderCollapse: "collapse", minWidth: "280px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "6px 16px 6px 0", opacity: 0.6 }}>Nettobetrag</td>
              <td style={{ padding: "6px 0", textAlign: "right", fontFamily: "monospace", fontWeight: "500" }}>{formatCurrency(subtotal)}</td>
            </tr>
            {taxRate != null && taxRate > 0 && (
              <tr>
                <td style={{ padding: "6px 16px 6px 0", opacity: 0.6 }}>MwSt. {taxRate} %</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontFamily: "monospace", fontWeight: "500" }}>{formatCurrency(taxAmount)}</td>
              </tr>
            )}
            <tr style={{ borderTop: "2px solid #1e3a5f" }}>
              <td style={{ padding: "10px 16px 10px 0", fontWeight: "700", fontSize: "14px" }}>Gesamtbetrag</td>
              <td style={{ padding: "10px 0", textAlign: "right", fontFamily: "monospace", fontWeight: "700", fontSize: "16px" }}>{formatCurrency(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
