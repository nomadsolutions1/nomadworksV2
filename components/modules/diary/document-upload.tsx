"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { deleteDiaryDocument } from "@/lib/actions/diary"
import type { DiaryDocument } from "@/lib/actions/diary"
import { FileText, Trash2, Upload, ExternalLink } from "lucide-react"
import { formatDateTime } from "@/lib/utils/format"

interface DocumentUploadProps {
  entryId: string
  documents: DiaryDocument[]
}

export function DocumentUpload({ entryId, documents }: DocumentUploadProps) {
  const [docs, setDocs] = useState<DiaryDocument[]>(documents)
  const [isPending, startTransition] = useTransition()

  function handleDelete(docId: string) {
    startTransition(async () => {
      const result = await deleteDiaryDocument(docId, entryId)
      if (result.error) {
        toast.error("Fehler beim Loeschen des Dokuments")
        return
      }
      toast.success("Dokument geloescht")
      setDocs((prev) => prev.filter((d) => d.id !== docId))
    })
  }

  function handleUploadPlaceholder() {
    toast.info("PDF-Upload wird in einer zukuenftigen Version aktiviert.")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {docs.length === 0
            ? "Noch keine Dokumente hochgeladen"
            : `${docs.length} Dokument${docs.length !== 1 ? "e" : ""}`}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl gap-2"
          onClick={handleUploadPlaceholder}
          disabled={isPending}
        >
          <Upload className="h-4 w-4" />
          PDF hochladen
        </Button>
      </div>
      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center rounded-2xl border-2 border-dashed border-border">
          <div className="rounded-xl bg-muted p-3 mb-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Keine Dokumente</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Laden Sie PDFs oder Bilder zu diesem Bericht hoch
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <Card key={doc.id} className="rounded-xl shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-lg shrink-0">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.uploaded_by_name} · {formatDateTime(doc.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors"
                    title="Oeffnen"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    disabled={isPending}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-destructive/10 transition-colors"
                    title="Loeschen"
                    aria-label={`Dokument loeschen: ${doc.file_name}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
