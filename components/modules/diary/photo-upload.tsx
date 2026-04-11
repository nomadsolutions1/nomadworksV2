"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { uploadDiaryPhoto, deleteDiaryPhoto } from "@/lib/actions/diary"
import type { DiaryPhoto } from "@/lib/actions/diary"

interface Props {
  entryId: string
  photos: DiaryPhoto[]
}

const MAX_PHOTOS = 10

export function DiaryPhotoUpload({ entryId, photos }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [lightbox, setLightbox] = useState<DiaryPhoto | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (photos.length >= MAX_PHOTOS) {
      toast.error(`Maximal ${MAX_PHOTOS} Fotos pro Bericht`)
      e.target.value = ""
      return
    }

    const fd = new FormData()
    fd.set("diary_entry_id", entryId)
    fd.set("file", file)

    startTransition(async () => {
      const result = await uploadDiaryPhoto(fd)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Foto hochgeladen")
        router.refresh()
      }
      if (inputRef.current) inputRef.current.value = ""
    })
  }

  function handleDelete(id: string) {
    if (!confirm("Foto wirklich löschen?")) return
    startTransition(async () => {
      const result = await deleteDiaryPhoto(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Foto gelöscht")
        setLightbox(null)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {photos.length}/{MAX_PHOTOS} Fotos · JPG, PNG, WebP · max. 5 MB
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg gap-1.5"
          onClick={() => inputRef.current?.click()}
          disabled={isPending || photos.length >= MAX_PHOTOS}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          Foto hinzufügen
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {photos.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 py-8 text-center text-sm text-muted-foreground">
          Noch keine Fotos hochgeladen.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted hover:ring-2 hover:ring-primary transition"
              onClick={() => setLightbox(photo)}
              aria-label="Foto öffnen"
            >
              <Image
                src={photo.file_url}
                alt={photo.caption ?? "Bautagesbericht-Foto"}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute -top-3 -right-3 z-10 rounded-full bg-background text-foreground p-2 shadow-lg hover:bg-muted"
              onClick={() => setLightbox(null)}
              aria-label="Schließen"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden">
              <Image
                src={lightbox.file_url}
                alt={lightbox.caption ?? "Foto"}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-white/90 flex-1">
                {lightbox.caption ?? ""}
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-lg gap-1.5"
                onClick={() => handleDelete(lightbox.id)}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4" />
                Löschen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
