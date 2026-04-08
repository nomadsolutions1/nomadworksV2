"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Building2 } from "lucide-react"
import {
  APP_MODULES,
  ADMIN_MODULES,
  WORKER_TABS,
  getFilteredModules,
  type NavModule,
} from "@/lib/config/navigation"

interface SidebarProps {
  role?: string
  allowedModules?: string[]
}

export function Sidebar({ role = "owner", allowedModules }: SidebarProps) {
  const pathname = usePathname()

  // Admin gets completely different navigation
  if (role === "super_admin") {
    return (
      <SidebarShell>
        <nav aria-label="Admin-Navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {ADMIN_MODULES.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
      </SidebarShell>
    )
  }

  // Worker/Employee: no sidebar
  if (role === "worker" || role === "employee") {
    return null
  }

  // Owner: all modules + Firma
  // Foreman/Office: filtered modules based on permissions
  const navigation = role === "owner"
    ? APP_MODULES
    : getFilteredModules(allowedModules)

  return (
    <SidebarShell>
      <nav aria-label="Hauptnavigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navigation.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      {role === "owner" && (
        <div className="border-t border-sidebar-border px-3 py-3 space-y-1">
          <NavLink
            item={{ key: "firma", label: "Firma", href: "/firma", icon: Building2 }}
            pathname={pathname}
          />
        </div>
      )}
    </SidebarShell>
  )
}

function SidebarShell({ children }: { children: React.ReactNode }) {
  return (
    <aside aria-label="Seitenleiste" className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col bg-sidebar-bg lg:flex">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <Building2 className="h-4 w-4 text-accent-foreground" />
        </div>
        <span className="text-lg font-bold text-sidebar-foreground font-heading">
          NomadWorks
        </span>
      </div>
      {children}
    </aside>
  )
}

function NavLink({ item, pathname }: { item: NavModule; pathname: string }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-foreground"
          : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {item.label}
    </Link>
  )
}

/**
 * Bottom navigation for worker role (mobile-first)
 */
export function WorkerBottomNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Worker-Navigation" className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-background px-2 py-2 shadow-lg">
      {WORKER_TABS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs font-medium transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
