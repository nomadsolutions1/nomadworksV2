import { getDiaryEntry } from "@/lib/actions/diary"
import { requireCompanyAuth } from "@/lib/utils/auth-helper"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Bautagesbericht drucken" }

export default async function DruckenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: entry } = await getDiaryEntry(id)
  if (!entry) redirect("/bautagesbericht")

  const { user, profile, db } = await requireCompanyAuth()
  if (!user || !profile) redirect("/login")

  const { data: company } = await db
    .from("companies")
    .select("name, address")
    .eq("id", profile.company_id)
    .single()

  const c = (company as Record<string, unknown>) || {}

  return (
    <div className="print-page bg-white p-8 max-w-[210mm] mx-auto text-[11px] text-foreground leading-relaxed">
      <style>{`
        @media print {
          body { margin: 0; -webkit-print-color-adjust: exact; }
          @page { size: A4; margin: 15mm; }
          .no-print { display: none !important; }
        }
        .print-page table { border-collapse: collapse; width: 100%; }
        .print-page th, .print-page td { border: 1px solid #374151; padding: 4px 8px; text-align: left; }
        .print-page th { background: hsl(var(--muted)); font-weight: 600; }
      `}</style>

      <div className="flex justify-between items-start mb-6 border-b pb-4">
        <div>
          <h1 className="text-lg font-bold">{c.name as string || "Firma"}</h1>
          <p className="text-[10px] text-muted-foreground">{c.address as string || ""}</p>
        </div>
        <div className="text-right text-[10px] text-muted-foreground">
          <p>Bautagesbericht</p>
          <p className="font-semibold text-foreground">{new Date(entry.entry_date).toLocaleDateString("de-DE")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 text-[11px]">
        <div><span className="font-semibold">Baustelle:</span> {entry.site_name}</div>
        <div><span className="font-semibold">Wetter:</span> {entry.weather || "\u2014"} {entry.temperature != null ? `${entry.temperature}\u00B0C` : ""}</div>
        <div><span className="font-semibold">Erstellt von:</span> {entry.created_by_name}</div>
      </div>

      {entry.work_description && (
        <div className="mb-6">
          <h2 className="font-bold mb-2 text-xs uppercase tracking-wide">Leistungen / Arbeiten</h2>
          <p className="whitespace-pre-wrap border rounded p-3 bg-muted text-[11px]">{entry.work_description}</p>
        </div>
      )}

      {(entry.incidents || entry.defects) && (
        <div className="mb-6">
          <h2 className="font-bold mb-2 text-xs uppercase tracking-wide">Aenderungen / Behinderungen / Sonstiges</h2>
          {entry.incidents && <p className="mb-1"><span className="font-semibold">Vorfälle:</span> {entry.incidents}</p>}
          {entry.defects && <p className="mb-1"><span className="font-semibold">Mängel:</span> {entry.defects}</p>}
        </div>
      )}

      {entry.notes && (
        <div className="mb-6">
          <h2 className="font-bold mb-2 text-xs uppercase tracking-wide">Bemerkungen</h2>
          <p className="whitespace-pre-wrap">{entry.notes}</p>
        </div>
      )}

      <div className="mt-12 pt-6 border-t flex justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground mb-8">Ort, Datum</p>
          <div className="border-b border-foreground w-48" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-8">Unterschrift</p>
          <div className="border-b border-foreground w-48" />
        </div>
      </div>

      <div className="no-print mt-8 text-center">
        <button
          onClick={() => window.print()}
          className="rounded-xl bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:bg-primary/90"
        >
          Drucken / Als PDF speichern
        </button>
      </div>
    </div>
  )
}
