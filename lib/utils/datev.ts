/**
 * DATEV-CSV Helpers (kein "use server" — rein Utility).
 *
 * DATEV erwartet:
 *  - Trennzeichen: Semikolon (;)
 *  - Dezimaltrennzeichen: Komma (,)
 *  - Zeilenende: CRLF (\r\n)
 *  - Encoding: Windows-1252 (Client lädt als text/csv;charset=windows-1252 herunter)
 *  - Datum: TT.MM.JJJJ
 *  - Strings mit Semikolon/Komma werden in Anführungszeichen eingefasst.
 *
 * Diese Helfer sind absichtlich einfach gehalten — ein formal vollständiges
 * DATEV-Format (z.B. "EXTF-Header mit Versionszeile") kann auf Basis dieser
 * Primitiven aufgebaut werden, ohne das Escaping neu zu erfinden.
 */

export function datevFmtNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "0,00"
  return n.toFixed(2).replace(".", ",")
}

export function datevFmtDate(iso: string | Date | null | undefined): string {
  if (!iso) return ""
  const d = typeof iso === "string" ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return ""
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

export function datevEscape(value: string | number | null | undefined): string {
  if (value == null) return ""
  const s = String(value)
  if (/[";\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function datevRow(cells: Array<string | number | null | undefined>): string {
  return cells.map(datevEscape).join(";")
}

/**
 * Baut eine komplette DATEV-CSV-Datei.
 * Fügt BOM voran, damit Excel (Windows) das File direkt in UTF-8 öffnet.
 * Zeilenende ist CRLF — DATEV- und Excel-kompatibel.
 */
export function buildDatevCsv(header: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const BOM = "\uFEFF"
  const lines = [datevRow(header), ...rows.map(datevRow)]
  return BOM + lines.join("\r\n") + "\r\n"
}
