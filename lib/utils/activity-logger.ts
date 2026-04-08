import { createAdminClient } from "@/lib/supabase/admin"
import { trackError } from "@/lib/utils/error-tracker"

export async function logActivity(params: {
  companyId: string
  userId: string
  action: string
  entityType: string
  entityId?: string
  title: string
}): Promise<void> {
  try {
    const db = createAdminClient()
    const { error } = await db.from("activity_log").insert({
      company_id: params.companyId,
      user_id: params.userId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      title: params.title,
    })
    if (error) {
      trackError("activity-logger", "logActivity", error.message, {
        companyId: params.companyId,
        entityType: params.entityType,
        action: params.action,
      })
    }
  } catch (err) {
    trackError(
      "activity-logger",
      "logActivity",
      err instanceof Error ? err.message : "Unknown error",
      {
        companyId: params.companyId,
        entityType: params.entityType,
        action: params.action,
      }
    )
  }
}
