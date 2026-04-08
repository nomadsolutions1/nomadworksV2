"use client"

import {
  Bell, Search, Menu, LogOut, Clock, Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { cn } from "@/lib/utils"
import { ROLE_LABELS } from "@/lib/utils/constants"
import {
  APP_MODULES,
  ADMIN_MODULES,
  getFilteredModules,
  type NavModule,
} from "@/lib/config/navigation"

interface HeaderProps {
  user?: {
    firstName: string
    lastName: string
    email: string
    role: string
  }
  unreadCount?: number
  role?: string
  allowedModules?: string[]
  isClockedIn?: boolean
}

export function Header({ user, unreadCount = 0, role, allowedModules, isClockedIn }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`
    : "?"

  async function handleSignOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push("/login")
  }

  const isWorker = role === "worker"
  const isAdmin = role === "super_admin"

  // Use the same navigation config as sidebar
  const mobileNavItems: NavModule[] = isAdmin
    ? ADMIN_MODULES
    : role === "owner"
      ? APP_MODULES
      : getFilteredModules(allowedModules)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
      {!isWorker && (
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menue oeffnen" />}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-sidebar-bg p-0 border-none">
            <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                <Building2 className="h-4 w-4 text-accent-foreground" />
              </div>
              <span className="text-lg font-bold text-sidebar-foreground font-heading">
                NomadWorks
              </span>
            </div>
            <nav aria-label="Mobile-Navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {mobileNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <SheetClose key={item.href} render={
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-foreground"
                          : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    />
                  }>
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </SheetClose>
                )
              })}
            </nav>
            {role === "owner" && (
              <div className="border-t border-sidebar-border px-3 py-3 space-y-1">
                <SheetClose render={
                  <Link
                    href="/firma"
                    aria-current={pathname.startsWith("/firma") ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname.startsWith("/firma")
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  />
                }>
                  <Building2 className="h-5 w-5 shrink-0" />
                  Firma
                </SheetClose>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}

      {isWorker && <div />}

      {!isWorker && (
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Suchen... (Cmd+K)"
              className="h-10 w-full rounded-xl border border-border bg-muted pl-9 pr-4 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
              readOnly
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {!isAdmin && !isWorker && (
          <Link href="/stempeln">
            <Button variant="ghost" size="icon" className="relative" title={isClockedIn ? "Eingestempelt" : "Zeiterfassung"} aria-label="Zeiterfassung">
              <Clock className={cn("h-5 w-5", isClockedIn ? "text-success" : "text-muted-foreground")} />
              {isClockedIn && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-success border-2 border-background" />
              )}
            </Button>
          </Link>
        )}
        {!isAdmin && !isWorker && (
          <Link href="/benachrichtigungen">
            <Button variant="ghost" size="icon" className="relative" aria-label="Benachrichtigungen">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-danger-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </Link>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="flex items-center gap-2 rounded-xl px-2" aria-label="Benutzermenue" />}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium text-foreground">
                {user ? `${user.firstName} ${user.lastName}` : "Benutzer"}
              </span>
              <span className="text-xs text-muted-foreground">{ROLE_LABELS[user?.role ?? ""] || user?.role || "Rolle"}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            {!isAdmin && (
              <DropdownMenuItem render={<Link href="/profil" />}>
                Profil
              </DropdownMenuItem>
            )}
            {role === "owner" && (
              <DropdownMenuItem render={<Link href="/firma" />}>
                Firmeneinstellungen
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Abmelden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
