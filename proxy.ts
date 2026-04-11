import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

const publicRoutes = ["/login", "/register", "/invite", "/verify", "/reset-password", "/update-password", "/impressum", "/datenschutz", "/agb"]

// Routes accessible by workers (everything else is blocked)
const workerRoutes = ["/zeiterfassung", "/stempeln", "/profil", "/stundenzettel"]

// Routes that require owner role
const ownerOnlyRoutes = ["/firma"]

// Routes accessible by accountant (read-only + SOKA/DATEV export).
// Every other route is blocked (redirect to /dashboard).
const accountantAllowedPrefixes = [
  "/dashboard",
  "/profil",
  "/benachrichtigungen",
  "/rechnungen",
  "/mitarbeiter",
  "/firma/soka-export",
  "/firma/steuerberater",
]

// "Write" path markers — used to block accountant POSTs via URL (neu/bearbeiten)
// and also act as write-signal for foreman/office permission checks.
function isWritePath(pathname: string): boolean {
  return (
    pathname.endsWith("/neu") ||
    pathname.includes("/bearbeiten") ||
    pathname.includes("/edit")
  )
}

// Module route prefixes that require foreman permission check
const moduleRoutes: Record<string, string> = {
  "/mitarbeiter": "mitarbeiter",
  "/baustellen": "baustellen",
  "/stempeln": "zeiterfassung",
  "/zeiterfassung": "zeiterfassung",
  "/disposition": "disposition",
  "/auftraege": "auftraege",
  "/fuhrpark": "fuhrpark",
  "/lager": "lager",
  "/rechnungen": "rechnungen",
  "/subunternehmer": "subunternehmer",
  "/bautagesbericht": "bautagesbericht",
}

// API routes that bypass auth (webhooks need raw body, cron uses secret)
const publicApiRoutes = ["/api/webhooks", "/api/cron"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next()
  }

  // FIX: API routes now get auth check, except webhooks and cron
  if (pathname.startsWith("/api")) {
    if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.next()
    }
    // API routes that require auth: verify session exists
    // (detailed permission checks happen in the route handlers themselves)
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // For API routes, return 401 instead of redirect
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Fetch profile once for all route checks
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  // FIX: No fallback to "worker" on DB timeout — deny access instead
  if (!profile || profileError) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Profil konnte nicht geladen werden" }, { status: 503 })
    }
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("error", "profile_load_failed")
    return NextResponse.redirect(loginUrl)
  }

  const role = profile.role

  // For authenticated API routes, let the route handler do role checks
  if (pathname.startsWith("/api")) {
    return response
  }

  // --- Root redirect based on role ---
  if (pathname === "/") {
    if (role === "worker") {
      return NextResponse.redirect(new URL("/zeiterfassung", request.url))
    }
    if (role === "super_admin") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    if (role === "employee") {
      return NextResponse.redirect(new URL("/profil", request.url))
    }
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // --- Super Admin: only /admin routes ---
  if (role === "super_admin") {
    if (pathname.startsWith("/admin")) {
      return response
    }
    // super_admin cannot access company modules
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  // --- Admin routes: only super_admin (already handled above) ---
  if (pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // --- Employee: only /profil (own profile), nothing else ---
  if (role === "employee") {
    if (pathname.startsWith("/profil")) {
      return response
    }
    return NextResponse.redirect(new URL("/profil", request.url))
  }

  // --- Worker: only worker routes ---
  if (role === "worker") {
    const isAllowed = workerRoutes.some((route) => pathname.startsWith(route))
    if (!isAllowed) {
      return NextResponse.redirect(new URL("/zeiterfassung", request.url))
    }
    return response
  }

  // --- Accountant: only whitelisted routes, read-only ---
  if (role === "accountant") {
    const isAllowed = accountantAllowedPrefixes.some((route) => pathname.startsWith(route))
    if (!isAllowed) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    // Block write paths — accountant is read-only
    if (isWritePath(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    // /firma/* is owner-only, except the two whitelisted subpaths above which
    // we already matched. We fall through to the ownerOnlyRoutes check below
    // which would block /firma — so short-circuit here for the allowed subpaths.
    if (pathname.startsWith("/firma/soka-export") || pathname.startsWith("/firma/steuerberater")) {
      return response
    }
    // Everything else in the whitelist is outside /firma → safe to continue.
    return response
  }

  // --- Onboarding redirect for owners ---
  if (role === "owner" && !pathname.startsWith("/onboarding") && !pathname.startsWith("/profil")) {
    const { data: companyCheck } = await supabase
      .from("companies")
      .select("onboarding_completed")
      .eq("id", (await supabase.from("profiles").select("company_id").eq("id", user.id).single()).data?.company_id || "")
      .single()

    if (companyCheck && !companyCheck.onboarding_completed) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
  }

  // --- Owner-only routes ---
  if (ownerOnlyRoutes.some((route) => pathname.startsWith(route))) {
    if (role !== "owner") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return response
  }

  // --- Foreman + Office: check module permissions ---
  // (Accountant is handled above as a strict whitelist; employee has its own branch.)
  if (role === "foreman" || role === "office") {
    // Dashboard, profil, benachrichtigungen are always accessible
    if (
      pathname === "/dashboard" ||
      pathname.startsWith("/profil") ||
      pathname.startsWith("/benachrichtigungen")
    ) {
      return response
    }

    // Office role-delta: full access to all standard modules, no permission lookup.
    if (role === "office") {
      const matchedRoute = Object.keys(moduleRoutes).find((route) =>
        pathname.startsWith(route)
      )
      if (matchedRoute) {
        // office gets implicit access — auth-helper.checkModuleAccess enforces
        // the same at the server-action layer (Defense in Depth).
        return response
      }
      // Non-module routes (e.g., /onboarding) fall through → allow
      return response
    }

    // Foreman: check foreman_permissions table as before.
    const matchedRoute = Object.keys(moduleRoutes).find((route) =>
      pathname.startsWith(route)
    )
    if (matchedRoute) {
      const moduleName = moduleRoutes[matchedRoute]
      const isWriteRoute = isWritePath(pathname)
      const { data: permission } = await supabase
        .from("foreman_permissions")
        .select("can_view, can_edit")
        .eq("foreman_id", user.id)
        .eq("module_name", moduleName)
        .single()

      const requiredPerm = isWriteRoute ? permission?.can_edit : permission?.can_view
      if (!requiredPerm) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
}
