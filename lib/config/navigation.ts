import {
  LayoutDashboard,
  Users,
  MapPin,
  CalendarDays,
  FileText,
  Truck,
  Package,
  Receipt,
  Handshake,
  ClipboardList,
  Building2,
  Clock,
  type LucideIcon,
} from "lucide-react"

// ── Types ──

export interface NavModule {
  key: string
  label: string
  href: string
  icon: LucideIcon
  module?: string // maps to foreman_permissions.module_name for RBAC
}

export interface WorkerTab {
  key: string
  label: string
  href: string
  icon: LucideIcon
}

// ── App Modules (Owner / Foreman / Office) ──

export const APP_MODULES: NavModule[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "mitarbeiter", label: "Mitarbeiter", href: "/mitarbeiter", icon: Users, module: "mitarbeiter" },
  { key: "baustellen", label: "Baustellen", href: "/baustellen", icon: MapPin, module: "baustellen" },
  { key: "disposition", label: "Disposition", href: "/disposition", icon: CalendarDays, module: "disposition" },
  { key: "auftraege", label: "Auftraege", href: "/auftraege", icon: FileText, module: "auftraege" },
  { key: "fuhrpark", label: "Fuhrpark", href: "/fuhrpark", icon: Truck, module: "fuhrpark" },
  { key: "lager", label: "Lager & Einkauf", href: "/lager", icon: Package, module: "lager" },
  { key: "rechnungen", label: "Rechnungen", href: "/rechnungen", icon: Receipt, module: "rechnungen" },
  { key: "subunternehmer", label: "Subunternehmer", href: "/subunternehmer", icon: Handshake, module: "subunternehmer" },
  { key: "bautagesbericht", label: "Bautagesbericht", href: "/bautagesbericht", icon: ClipboardList, module: "bautagesbericht" },
]

// ── Admin Modules (super_admin) ──

export const ADMIN_MODULES: NavModule[] = [
  { key: "admin-dashboard", label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { key: "admin-firmen", label: "Firmen", href: "/admin/firmen", icon: Building2 },
  { key: "admin-benutzer", label: "Benutzer", href: "/admin/benutzer", icon: Users },
]

// ── Worker Tabs (bottom nav) ──

export const WORKER_TABS: WorkerTab[] = [
  { key: "stempeln", label: "Stempeln", href: "/zeiterfassung", icon: Clock },
  { key: "stundenzettel", label: "Stundenzettel", href: "/stundenzettel", icon: ClipboardList },
  { key: "profil", label: "Profil", href: "/profil", icon: Users },
]

// ── Helper: filter modules by allowed list (for foreman/office roles) ──

export function getFilteredModules(allowedModules?: string[]): NavModule[] {
  if (!allowedModules) return APP_MODULES
  return APP_MODULES.filter(
    (item) => !item.module || allowedModules.includes(item.module)
  )
}
