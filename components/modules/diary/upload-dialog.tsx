"use client"

import { useState, useTransition, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X, FileText, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { uploadDiaryDocument, createDiaryEntry } from "@/lib/actions/diary"
import { toast } from "sonner"

interface UploadDialogProps {
  open: boolean
  onClose: () => void
  sites: { id: string; name: string }[]
  companyId: string
}

export function UploadDialog({ open, onClose, sites, companyId }: UploadDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [siteId, setSiteId] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [files, setFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files || [])
    const valid = newFiles.filter(
      (f) => f.size <= 10 * 1024 * 1024 && /\.(pdf|jpg|jpeg|png)$/i.test(f.name)
    )
    setFiles((prev) => [...prev, ...valid])
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleSubmit() {
    if (!siteId || !date || files.length === 0) {
      toast.error("Bitte Baustelle, Datum und mindestens eine Datei auswaehlen")
      return
    }

    startTransition(async () => {
      const fd = new FormData()
      fd.set("site_id", siteId)
      fd.set("entry_date", date)
      const entryResult = await createDiaryEntry(fd)
      const entryId = entryResult.id
      if (!entryId) {
        toast.error("Fehler beim Erstellen des Eintrags")
        return
      }

      const supabase = createClient()
      let uploaded = 0
      for (const file of files) {
        const filePath = `${companyId}/${entryId}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from("bautagesberichte")
          .upload(filePath, file)

        if (uploadError) {
          toast.error(`Fehler bei ${file.name}: ${uploadError.message}`)
          continue
        }

        const { data: urlData } = supabase.storage.from("bautagesberichte").getPublicUrl(filePath)
        await uploadDiaryDocument({
          diary_entry_id: entryId,
          file_url: urlData.publicUrl,
          file_name: file.name,
        })
        uploaded++
      }

      if (uploaded > 0) toast.success(`${uploaded} Datei(en) hochgeladen`)
      setFiles([])
      setSiteId("")
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle>Bericht hochladen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Baustelle *</Label>
            <Select value={siteId} onValueChange={(v) => setSiteId(v ?? "")}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Baustelle auswaehlen" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Datum *</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Dateien (PDF, JPG, PNG — max 10 MB)</Label>
            <div
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Klicken oder Dateien hierher ziehen</p>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                className="hidden"
                onChange={handleFiles}
              />
            </div>
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={`file-${f.name}-${f.size}`} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate max-w-[200px]">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isPending || !siteId || files.length === 0}
            className="w-full rounded-xl font-semibold h-11"
          >
            {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Hochladen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
