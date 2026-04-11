"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { trackError } from "@/lib/utils/error-tracker"
import { logActivity } from "@/lib/utils/activity-logger"
import { withAuth } from "@/lib/utils/auth-helper"
import { buildProfileNameMap, buildSiteNameMap } from "@/lib/utils/shared-queries"

// ─── Types ────────────────────────────────────────────────────

export type DiaryEntry = {
  id: string
  company_id: string
  site_id: string
  site_name: string
  entry_date: string
  weather: string | null
  temperature: number | null
  wind: string | null
  incidents: string | null
  defects: string | null
  work_description: string
  notes: string | null
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
}

export type DiaryDocument = {
  id: string
  diary_entry_id: string | null
  file_url: string
  file_name: string
  file_size: number | null
  uploaded_by: string | null
  uploaded_by_name: string
  created_at: string
}

export type DiaryPhoto = {
  id: string
  diary_entry_id: string
  file_path: string
  file_url: string
  caption: string | null
  created_at: string
}

export type DiaryStats = {
  monthCount: number
  todayCount: number
  sitesWithEntries: number
  documentCount: number
}

// ─── Zod Schemas ──────────────────────────────────────────────

const diaryEntrySchema = z.object({
  site_id: z.string().uuid("Baustelle ist erforderlich"),
  entry_date: z.string().min(1, "Datum ist erforderlich"),
  weather: z.string().optional().transform((v) => v || null),
  temperature: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? parseFloat(v.replace(",", ".")) : null)),
  wind: z.string().optional().transform((v) => v || null),
  incidents: z.string().optional().transform((v) => v || null),
  defects: z.string().optional().transform((v) => v || null),
  work_description: z.string().optional().transform((v) => v || ""),
  notes: z.string().optional().transform((v) => v || null),
})

const documentMetaSchema = z.object({
  diary_entry_id: z.string().uuid("Eintrag-ID ist erforderlich"),
  file_url: z.string().min(1, "Datei-URL ist erforderlich"),
  file_name: z.string().min(1, "Dateiname ist erforderlich"),
  file_type: z.string().optional().transform((v) => v || null),
})

// ─── Contextual Tips ─────────────────────────────────────────

const DIARY_TIPS: Record<string, string> = {
  bautagesbericht:
    "Tipp: Erfassen Sie täglich Wetter, Arbeiten und Vorkommnisse. Fotos und Dokumente können direkt angehängt werden. Der Bautagesbericht ist ein rechtlich wichtiges Dokument.",
}

export async function getContextualTips(module: string): Promise<string | null> {
  return DIARY_TIPS[module] ?? null
}

// ─── getDiaryEntries ──────────────────────────────────────────

export async function getDiaryEntries(
  siteId?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<{ data?: DiaryEntry[]; error?: string }> {
  return withAuth("bautagesbericht", "read", async ({ profile, db }) => {
    let query = db
      .from("diary_entries")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })

    if (siteId) query = query.eq("site_id", siteId)
    if (dateFrom) query = query.gte("entry_date", dateFrom)
    if (dateTo) query = query.lte("entry_date", dateTo)

    const { data: entries, error } = await query

    if (error) {
      trackError("diary", "getDiaryEntries", error.message, { table: "diary_entries" })
      return { error: "Bautagesberichte konnten nicht geladen werden" }
    }

    const rows = entries ?? []
    if (rows.length === 0) return { data: [] }

    // Fetch site names + creator names in parallel
    const siteIds = [...new Set(rows.map((r) => r.site_id))]
    const creatorIds = [...new Set(rows.map((r) => r.created_by))]

    const [siteMap, profileMap] = await Promise.all([
      buildSiteNameMap(db, profile.company_id, siteIds),
      buildProfileNameMap(db, profile.company_id, creatorIds),
    ])

    return {
      data: rows.map((r) => ({
        id: r.id,
        company_id: r.company_id,
        site_id: r.site_id,
        site_name: siteMap.get(r.site_id) ?? "—",
        entry_date: r.entry_date,
        weather: r.weather,
        temperature: r.temperature != null ? Number(r.temperature) : null,
        wind: r.wind,
        incidents: r.incidents,
        defects: r.defects,
        work_description: r.work_description,
        notes: r.hindrances,
        created_by: r.created_by,
        created_by_name: profileMap.get(r.created_by) ?? "—",
        created_at: r.created_at,
        updated_at: r.updated_at,
      })),
    }
  }) as Promise<{ data?: DiaryEntry[]; error?: string }>
}

// ─── getDiaryEntry ────────────────────────────────────────────

export async function getDiaryEntry(
  id: string
): Promise<{ data?: DiaryEntry; error?: string }> {
  return withAuth("bautagesbericht", "read", async ({ profile, db }) => {
    const { data: entry, error } = await db
      .from("diary_entries")
      .select("*")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    if (error || !entry) return { error: "Eintrag nicht gefunden" }

    // Fetch site name + creator name in parallel
    const [siteMap, profileMap] = await Promise.all([
      buildSiteNameMap(db, profile.company_id, [entry.site_id]),
      buildProfileNameMap(db, profile.company_id, [entry.created_by]),
    ])

    return {
      data: {
        id: entry.id,
        company_id: entry.company_id,
        site_id: entry.site_id,
        site_name: siteMap.get(entry.site_id) ?? "—",
        entry_date: entry.entry_date,
        weather: entry.weather,
        temperature: entry.temperature != null ? Number(entry.temperature) : null,
        wind: entry.wind,
        incidents: entry.incidents,
        defects: entry.defects,
        work_description: entry.work_description,
        notes: entry.hindrances,
        created_by: entry.created_by,
        created_by_name: profileMap.get(entry.created_by) ?? "—",
        created_at: entry.created_at,
        updated_at: entry.updated_at,
      },
    }
  }) as Promise<{ data?: DiaryEntry; error?: string }>
}

// ─── getDiaryStats ────────────────────────────────────────────

export async function getDiaryStats(): Promise<{ data?: DiaryStats; error?: string }> {
  return withAuth("bautagesbericht", "read", async ({ profile, db }) => {
    const today = new Date().toISOString().split("T")[0]
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0]

    const [monthRes, todayRes, docsRes] = await Promise.all([
      db
        .from("diary_entries")
        .select("id, site_id")
        .eq("company_id", profile.company_id)
        .gte("entry_date", monthStart),
      db
        .from("diary_entries")
        .select("id")
        .eq("company_id", profile.company_id)
        .eq("entry_date", today),
      db
        .from("diary_documents")
        .select("id")
        .eq("company_id", profile.company_id),
    ])

    const monthEntries = monthRes.data ?? []
    const uniqueSites = new Set(monthEntries.map((r) => r.site_id)).size

    return {
      data: {
        monthCount: monthEntries.length,
        todayCount: (todayRes.data ?? []).length,
        sitesWithEntries: uniqueSites,
        documentCount: (docsRes.data ?? []).length,
      },
    }
  }) as Promise<{ data?: DiaryStats; error?: string }>
}

// ─── createDiaryEntry ─────────────────────────────────────────

export async function createDiaryEntry(
  formData: FormData
): Promise<{ success?: boolean; id?: string; error?: string | Record<string, string[]> }> {
  return withAuth("bautagesbericht", "write", async ({ user, profile, db }) => {
    const validated = diaryEntrySchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const { site_id, entry_date, weather, temperature, wind, incidents, defects, work_description, notes } =
      validated.data

    // Validate site belongs to company
    const { data: siteCheck } = await db
      .from("construction_sites")
      .select("id, name")
      .eq("id", site_id)
      .eq("company_id", profile.company_id)
      .maybeSingle()

    if (!siteCheck) return { error: "Baustelle gehört nicht zu Ihrer Firma" }

    const { data: entry, error } = await db
      .from("diary_entries")
      .insert({
        company_id: profile.company_id,
        site_id,
        entry_date,
        weather,
        temperature,
        wind,
        incidents,
        defects,
        work_description: work_description || "",
        hindrances: notes,
        created_by: user.id,
      })
      .select("id")
      .single()

    if (error) {
      trackError("diary", "createDiaryEntry", error.message, { table: "diary_entries" })
      return { error: "Bautagesbericht konnte nicht erstellt werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "diary_entry",
      entityId: entry.id,
      title: `Bautagesbericht erstellt: ${siteCheck.name} am ${entry_date}`,
    })

    revalidatePath("/bautagesbericht")
    return { success: true, id: entry.id }
  }) as Promise<{ success?: boolean; id?: string; error?: string | Record<string, string[]> }>
}

// ─── updateDiaryEntry ─────────────────────────────────────────

export async function updateDiaryEntry(
  id: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("bautagesbericht", "write", async ({ user, profile, db }) => {
    const validated = diaryEntrySchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const { site_id, entry_date, weather, temperature, wind, incidents, defects, work_description, notes } =
      validated.data

    const { error } = await db
      .from("diary_entries")
      .update({
        site_id,
        entry_date,
        weather,
        temperature,
        wind,
        incidents,
        defects,
        work_description: work_description || "",
        hindrances: notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("diary", "updateDiaryEntry", error.message, { table: "diary_entries" })
      return { error: "Bautagesbericht konnte nicht aktualisiert werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "diary_entry",
      entityId: id,
      title: `Bautagesbericht aktualisiert am ${entry_date}`,
    })

    revalidatePath("/bautagesbericht")
    revalidatePath(`/bautagesbericht/${id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

// ─── deleteDiaryEntry ─────────────────────────────────────────

export async function deleteDiaryEntry(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("bautagesbericht", "write", async ({ user, profile, db }) => {
    // Only owner can delete
    if (profile.role !== "owner") {
      return { error: "Nur der Inhaber darf Bautagesberichte löschen" }
    }

    // Get entry info for activity log
    const { data: entry } = await db
      .from("diary_entries")
      .select("entry_date, site_id")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .maybeSingle()

    const { error } = await db
      .from("diary_entries")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("diary", "deleteDiaryEntry", error.message, { table: "diary_entries" })
      return { error: "Bautagesbericht konnte nicht gelöscht werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "diary_entry",
      entityId: id,
      title: entry
        ? `Bautagesbericht vom ${entry.entry_date} gelöscht`
        : "Bautagesbericht gelöscht",
    })

    revalidatePath("/bautagesbericht")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── getDiaryDocuments ────────────────────────────────────────

export async function getDiaryDocuments(
  entryId: string
): Promise<{ data?: DiaryDocument[]; error?: string }> {
  return withAuth("bautagesbericht", "read", async ({ profile, db }) => {
    const { data: docs, error } = await db
      .from("diary_documents")
      .select("*")
      .eq("diary_entry_id", entryId)
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })

    if (error) {
      trackError("diary", "getDiaryDocuments", error.message, { table: "diary_documents" })
      return { error: "Dokumente konnten nicht geladen werden" }
    }

    const rows = docs ?? []
    if (rows.length === 0) return { data: [] }

    // Fetch uploader names
    const uploaderIds = [...new Set(rows.filter((r) => r.uploaded_by).map((r) => r.uploaded_by as string))]
    const profileMap = uploaderIds.length > 0
      ? await buildProfileNameMap(db, profile.company_id, uploaderIds)
      : new Map<string, string>()

    return {
      data: rows.map((r) => ({
        id: r.id,
        diary_entry_id: r.diary_entry_id,
        file_url: r.file_url,
        file_name: r.file_name,
        file_size: r.file_size,
        uploaded_by: r.uploaded_by,
        uploaded_by_name: r.uploaded_by ? profileMap.get(r.uploaded_by) ?? "—" : "—",
        created_at: r.created_at,
      })),
    }
  }) as Promise<{ data?: DiaryDocument[]; error?: string }>
}

// ─── uploadDiaryDocument (metadata only) ─────────────────────

export async function uploadDiaryDocument(
  data: { diary_entry_id: string; file_url: string; file_name: string; file_type?: string }
): Promise<{ success?: boolean; data?: DiaryDocument; error?: string | Record<string, string[]> }> {
  return withAuth("bautagesbericht", "write", async ({ user, profile, db }) => {
    const validated = documentMetaSchema.safeParse(data)
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    // Verify diary entry belongs to company
    const { data: entryCheck } = await db
      .from("diary_entries")
      .select("id")
      .eq("id", validated.data.diary_entry_id)
      .eq("company_id", profile.company_id)
      .maybeSingle()

    if (!entryCheck) return { error: "Bautagesbericht nicht gefunden" }

    const { data: doc, error } = await db
      .from("diary_documents")
      .insert({
        company_id: profile.company_id,
        diary_entry_id: validated.data.diary_entry_id,
        file_url: validated.data.file_url,
        file_name: validated.data.file_name,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (error) {
      trackError("diary", "uploadDiaryDocument", error.message, { table: "diary_documents" })
      return { error: "Dokument konnte nicht gespeichert werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "diary_document",
      entityId: doc.id,
      title: `Dokument "${validated.data.file_name}" hochgeladen`,
    })

    revalidatePath(`/bautagesbericht/${validated.data.diary_entry_id}`)
    return {
      success: true,
      data: {
        id: doc.id,
        diary_entry_id: doc.diary_entry_id,
        file_url: doc.file_url,
        file_name: doc.file_name,
        file_size: doc.file_size,
        uploaded_by: doc.uploaded_by,
        uploaded_by_name: "—",
        created_at: doc.created_at,
      },
    }
  }) as Promise<{ success?: boolean; data?: DiaryDocument; error?: string | Record<string, string[]> }>
}

// ─── deleteDiaryDocument ─────────────────────────────────────

export async function deleteDiaryDocument(
  docId: string,
  entryId: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("bautagesbericht", "write", async ({ user, profile, db }) => {
    // Get doc info for permission check + activity log
    const { data: doc } = await db
      .from("diary_documents")
      .select("file_name, uploaded_by")
      .eq("id", docId)
      .eq("company_id", profile.company_id)
      .maybeSingle()

    if (!doc) {
      return { error: "Dokument nicht gefunden" }
    }

    // Only owner or the uploader may delete (consistent with deleteDiaryEntry)
    if (profile.role !== "owner" && doc.uploaded_by !== user.id) {
      return { error: "Nur der Inhaber oder der Uploader darf Dokumente löschen" }
    }

    const { error } = await db
      .from("diary_documents")
      .delete()
      .eq("id", docId)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("diary", "deleteDiaryDocument", error.message, { table: "diary_documents" })
      return { error: "Dokument konnte nicht gelöscht werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "diary_document",
      entityId: docId,
      title: doc ? `Dokument "${doc.file_name}" gelöscht` : "Dokument gelöscht",
    })

    revalidatePath(`/bautagesbericht/${entryId}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Diary Photos (Supabase Storage: bucket "diary-photos") ───

const PHOTO_BUCKET = "diary-photos"
const MAX_PHOTOS_PER_ENTRY = 10
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"]

function buildPhotoUrl(filePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  return `${base}/storage/v1/object/public/${PHOTO_BUCKET}/${filePath}`
}

// ─── getDiaryPhotos ───────────────────────────────────────────

export async function getDiaryPhotos(
  entryId: string
): Promise<{ data?: DiaryPhoto[]; error?: string }> {
  return withAuth("bautagesbericht", "read", async ({ profile, db }) => {
    // Ownership-Check: diary_entry must belong to company
    const { data: entryCheck } = await db
      .from("diary_entries")
      .select("id")
      .eq("id", entryId)
      .eq("company_id", profile.company_id)
      .maybeSingle()

    if (!entryCheck) return { data: [] }

    const { data: photos, error } = await db
      .from("diary_photos")
      .select("*")
      .eq("diary_entry_id", entryId)
      .order("created_at", { ascending: true })

    if (error) {
      trackError("diary", "getDiaryPhotos", error.message, { table: "diary_photos" })
      return { error: "Fotos konnten nicht geladen werden" }
    }

    const rows = photos ?? []
    return {
      data: rows.map((r) => ({
        id: r.id,
        diary_entry_id: r.diary_entry_id,
        file_path: r.file_path,
        file_url: buildPhotoUrl(r.file_path),
        caption: r.caption,
        created_at: r.created_at,
      })),
    }
  }) as Promise<{ data?: DiaryPhoto[]; error?: string }>
}

// ─── uploadDiaryPhoto ─────────────────────────────────────────

export async function uploadDiaryPhoto(
  formData: FormData
): Promise<{ success?: boolean; data?: DiaryPhoto; error?: string }> {
  return withAuth("bautagesbericht", "write", async ({ user, profile, db }) => {
    const entryId = formData.get("diary_entry_id")
    const file = formData.get("file")
    const caption = formData.get("caption")

    if (typeof entryId !== "string" || !entryId) {
      return { error: "Bautagesbericht-ID fehlt" }
    }
    if (!(file instanceof File)) {
      return { error: "Datei fehlt" }
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      return { error: "Foto ist zu groß (max. 5 MB)" }
    }
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      return { error: "Nur JPG, PNG oder WebP erlaubt" }
    }

    // Ownership-Check
    const { data: entryCheck } = await db
      .from("diary_entries")
      .select("id, entry_date, site_id")
      .eq("id", entryId)
      .eq("company_id", profile.company_id)
      .maybeSingle()

    if (!entryCheck) return { error: "Bautagesbericht nicht gefunden" }

    // Limit: max 10 photos per entry
    const { count } = await db
      .from("diary_photos")
      .select("id", { count: "exact", head: true })
      .eq("diary_entry_id", entryId)

    if ((count ?? 0) >= MAX_PHOTOS_PER_ENTRY) {
      return { error: `Maximal ${MAX_PHOTOS_PER_ENTRY} Fotos pro Bericht` }
    }

    // Build pro-company path: {company_id}/{diary_id}/{timestamp}-{filename}
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const filePath = `${profile.company_id}/${entryId}/${Date.now()}-${safeName}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await db.storage
      .from(PHOTO_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      trackError("diary", "uploadDiaryPhoto.storage", uploadError.message, { bucket: PHOTO_BUCKET })
      return { error: `Upload fehlgeschlagen: ${uploadError.message}` }
    }

    const captionStr =
      typeof caption === "string" && caption.trim() ? caption.trim() : null

    const { data: row, error: insertError } = await db
      .from("diary_photos")
      .insert({
        diary_entry_id: entryId,
        file_path: filePath,
        caption: captionStr,
      })
      .select()
      .single()

    if (insertError) {
      // Rollback storage upload
      await db.storage.from(PHOTO_BUCKET).remove([filePath])
      trackError("diary", "uploadDiaryPhoto.insert", insertError.message, { table: "diary_photos" })
      return { error: "Foto-Metadaten konnten nicht gespeichert werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "diary_photo",
      entityId: row.id,
      title: `Foto hochgeladen für Bautagesbericht ${entryCheck.entry_date}`,
    })

    revalidatePath(`/bautagesbericht/${entryId}`)
    return {
      success: true,
      data: {
        id: row.id,
        diary_entry_id: row.diary_entry_id,
        file_path: row.file_path,
        file_url: buildPhotoUrl(row.file_path),
        caption: row.caption,
        created_at: row.created_at,
      },
    }
  }) as Promise<{ success?: boolean; data?: DiaryPhoto; error?: string }>
}

// ─── deleteDiaryPhoto ─────────────────────────────────────────

export async function deleteDiaryPhoto(
  photoId: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("bautagesbericht", "write", async ({ user, profile, db }) => {
    // Load photo + check ownership via diary_entry
    const { data: photo } = await db
      .from("diary_photos")
      .select("id, file_path, diary_entry_id, diary_entries!inner(company_id)")
      .eq("id", photoId)
      .maybeSingle()

    if (!photo) return { error: "Foto nicht gefunden" }

    const entryCompany = (photo as unknown as {
      diary_entries: { company_id: string } | { company_id: string }[]
    }).diary_entries
    const companyId = Array.isArray(entryCompany) ? entryCompany[0]?.company_id : entryCompany?.company_id
    if (companyId !== profile.company_id) {
      return { error: "Foto gehört nicht zu Ihrer Firma" }
    }

    // Delete storage object
    await db.storage.from(PHOTO_BUCKET).remove([photo.file_path])

    const { error } = await db.from("diary_photos").delete().eq("id", photoId)

    if (error) {
      trackError("diary", "deleteDiaryPhoto", error.message, { table: "diary_photos" })
      return { error: "Foto konnte nicht gelöscht werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "diary_photo",
      entityId: photoId,
      title: "Bautagesbericht-Foto gelöscht",
    })

    revalidatePath(`/bautagesbericht/${photo.diary_entry_id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}
