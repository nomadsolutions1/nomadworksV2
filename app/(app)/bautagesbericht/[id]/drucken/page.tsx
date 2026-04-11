import { getDiaryEntry, getDiaryPhotos } from "@/lib/actions/diary"
import { getTimeEntriesForSite } from "@/lib/actions/sites"
import { requireCompanyAuth } from "@/lib/utils/auth-helper"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { PrintButton } from "./print-button"

export const metadata: Metadata = { title: "Bautagesbericht drucken" }

export default async function DruckenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: entry } = await getDiaryEntry(id)
  if (!entry) redirect("/bautagesbericht")

  const { user, profile, db } = await requireCompanyAuth()
  if (!user || !profile) redirect("/login")

  const [{ data: company }, { data: timeEntries = [] }, { data: photos = [] }] = await Promise.all([
    db
      .from("companies")
      .select("name, address")
      .eq("id", profile.company_id)
      .single(),
    getTimeEntriesForSite(entry.site_id),
    getDiaryPhotos(id),
  ])

  const c = (company as Record<string, unknown>) || {}

  // Filter time entries to entry date
  const dateEntries = timeEntries.filter((te) => te.date === entry.entry_date)
  const totalHours = dateEntries.reduce((s, te) => s + te.total_hours, 0)

  return (
    <div className="print-page bg-white p-8 max-w-[210mm] mx-auto text-[12px] text-foreground leading-relaxed">
      <style>{`
        @media print {
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 15mm; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }
        }
        .print-page table { border-collapse: collapse; width: 100%; font-size: 11px; }
        .print-page th, .print-page td { border: 1px solid #374151; padding: 5px 8px; text-align: left; }
        .print-page th { background: #f1f5f9; font-weight: 600; }
        .print-page h2 { font-size: 12px; }
      `}</style>

      <div className="flex justify-between items-start mb-6 border-b pb-4">
        <div>
          <h1 className="text-xl font-bold">{(c.name as string) || "Firma"}</h1>
          <p className="text-[11px] text-muted-foreground">{(c.address as string) || ""}</p>
        </div>
        <div className="text-right text-[11px] text-muted-foreground">
          <p>Bautagesbericht</p>
          <p className="font-semibold text-foreground text-[13px]">
            {new Date(entry.entry_date).toLocaleDateString("de-DE")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 text-[12px] avoid-break">
        <div>
          <span className="font-semibold">Baustelle:</span> {entry.site_name}
        </div>
        <div>
          <span className="font-semibold">Wetter:</span> {entry.weather || "\u2014"}{" "}
          {entry.temperature != null ? `${entry.temperature}\u00B0C` : ""}
        </div>
        <div>
          <span className="font-semibold">Erstellt von:</span> {entry.created_by_name}
        </div>
        {entry.wind && (
          <div>
            <span className="font-semibold">Wind:</span> {entry.wind}
          </div>
        )}
      </div>

      {dateEntries.length > 0 && (
        <div className="mb-6 avoid-break">
          <h2 className="font-bold mb-2 text-xs uppercase tracking-wide">Arbeitszeiten</h2>
          <table>
            <thead>
              <tr>
                <th>Mitarbeiter</th>
                <th>Von</th>
                <th>Bis</th>
                <th>Pause</th>
                <th>Stunden</th>
              </tr>
            </thead>
            <tbody>
              {dateEntries.map((te) => (
                <tr key={te.id}>
                  <td>{te.user_name}</td>
                  <td>
                    {new Date(te.clock_in).toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    {te.clock_out
                      ? new Date(te.clock_out).toLocaleTimeString("de-DE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "\u2014"}
                  </td>
                  <td>{te.break_minutes} min</td>
                  <td>{te.total_hours.toFixed(1)}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td colSpan={4}>Gesamt</td>
                <td>{totalHours.toFixed(1)} h</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {entry.work_description && (
        <div className="mb-6 avoid-break">
          <h2 className="font-bold mb-2 text-xs uppercase tracking-wide">Leistungen / Arbeiten</h2>
          <p className="whitespace-pre-wrap border rounded p-3 bg-muted text-[12px]">
            {entry.work_description}
          </p>
        </div>
      )}

      {(entry.incidents || entry.defects) && (
        <div className="mb-6 avoid-break">
          <h2 className="font-bold mb-2 text-xs uppercase tracking-wide">
            Änderungen / Behinderungen / Sonstiges
          </h2>
          {entry.incidents && (
            <p className="mb-1">
              <span className="font-semibold">Vorfälle:</span> {entry.incidents}
            </p>
          )}
          {entry.defects && (
            <p className="mb-1">
              <span className="font-semibold">Mängel:</span> {entry.defects}
            </p>
          )}
        </div>
      )}

      {entry.notes && (
        <div className="mb-6 avoid-break">
          <h2 className="font-bold mb-2 text-xs uppercase tracking-wide">Bemerkungen</h2>
          <p className="whitespace-pre-wrap">{entry.notes}</p>
        </div>
      )}

      {photos.length > 0 && (
        <div className="mb-6 page-break">
          <h2 className="font-bold mb-3 text-xs uppercase tracking-wide">Fotos</h2>
          <div className="grid grid-cols-2 gap-3">
            {photos.map((p) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <figure key={p.id} className="avoid-break">
                <img
                  src={p.file_url}
                  alt={p.caption ?? "Foto"}
                  className="w-full h-auto rounded border border-border object-cover"
                  style={{ maxHeight: "120mm" }}
                />
                {p.caption && (
                  <figcaption className="text-[10px] text-muted-foreground mt-1">
                    {p.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 pt-6 border-t flex justify-between avoid-break">
        <div>
          <p className="text-[11px] text-muted-foreground mb-8">Ort, Datum</p>
          <div className="border-b border-foreground w-48" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground mb-8">Unterschrift Polier</p>
          <div className="border-b border-foreground w-48" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground mb-8">Unterschrift Bauleitung</p>
          <div className="border-b border-foreground w-48" />
        </div>
      </div>

      <div className="no-print mt-8 text-center">
        <PrintButton />
      </div>
    </div>
  )
}

