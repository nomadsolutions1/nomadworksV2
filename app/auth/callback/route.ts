import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") || "/dashboard"

  if (!code) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth", req.url))
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Check if profile already exists (e.g. admin-created accounts)
  const admin = createAdminClient()
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle()

  if (!existingProfile) {
    // First login after email confirmation - create company + profile
    const meta = user.user_metadata || {}
    const companyName = meta.company_name || (meta.first_name || "Neue") + " Firma"

    const { data: company } = await admin
      .from("companies")
      .insert({
        name: companyName,
        plan: "trial",
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        max_employees: 5,
        is_active: true,
      })
      .select("id")
      .single()

    if (company) {
      await admin.from("profiles").insert({
        id: user.id,
        company_id: company.id,
        first_name: meta.first_name || "",
        last_name: meta.last_name || "",
        role: "owner",
      })
    }
  }

  return NextResponse.redirect(new URL(next, req.url))
}
