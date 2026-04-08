import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = createAdminClient()
  const tables = ["companies", "profiles", "construction_sites", "orders", "invoices", "time_entries"]
  const counts: Record<string, number> = {}

  for (const table of tables) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (db.from as any)(table).select("id", { count: "exact", head: true })
    counts[table] = count ?? 0
  }

  console.log("[BACKUP CHECK]", JSON.stringify(counts))

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    tableCounts: counts,
  })
}
