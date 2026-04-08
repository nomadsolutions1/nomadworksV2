export const ROLES = {
  super_admin: "Administrator",
  owner: "Geschäftsführer",
  foreman: "Bauleiter",
  office: "Verwaltung",
  accountant: "Steuerberater",
  worker: "Bauarbeiter",
  employee: "Mitarbeiter",
} as const

// German display labels for UI (same as ROLES, explicit alias for clarity)
export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Administrator",
  owner: "Geschäftsführer",
  foreman: "Bauleiter",
  office: "Verwaltung",
  accountant: "Steuerberater",
  worker: "Bauarbeiter",
  employee: "Mitarbeiter",
}

export const MANAGER_ROLES = ["super_admin", "owner", "foreman", "office"] as const
export const ADMIN_ROLES = ["super_admin", "owner"] as const

// Module names for foreman permissions
export const FOREMAN_MODULES = [
  { name: "mitarbeiter", label: "Mitarbeiter" },
  { name: "baustellen", label: "Baustellen" },
  { name: "zeiterfassung", label: "Zeiterfassung" },
  { name: "disposition", label: "Disposition" },
  { name: "auftraege", label: "Aufträge" },
  { name: "fuhrpark", label: "Fuhrpark" },
  { name: "lager", label: "Lager & Einkauf" },
  { name: "rechnungen", label: "Rechnungen" },
  { name: "subunternehmer", label: "Subunternehmer" },
  { name: "bautagesbericht", label: "Bautagesbericht" },
] as const

// Map route prefixes to module names for permission checks
export const ROUTE_MODULE_MAP: Record<string, string> = {
  "/mitarbeiter": "mitarbeiter",
  "/baustellen": "baustellen",
  "/stempeln": "zeiterfassung",
  "/disposition": "disposition",
  "/auftraege": "auftraege",
  "/fuhrpark": "fuhrpark",
  "/lager": "lager",
  "/rechnungen": "rechnungen",
  "/subunternehmer": "subunternehmer",
  "/bautagesbericht": "bautagesbericht",
}

export const UNIT_LABELS: Record<string, string> = {
  piece: "Stück",
  Stk: "Stk",
  m: "Meter",
  m2: "m²",
  m3: "m³",
  kg: "kg",
  l: "Liter",
  pack: "Packung",
  Sack: "Sack",
  t: "Tonne",
  Palette: "Palette",
  Rolle: "Rolle",
  Paar: "Paar",
  Set: "Set",
  Eimer: "Eimer",
}

export const PLANS = {
  trial: { name: "Trial", price: 0, maxEmployees: 5 },
  starter: { name: "Starter", price: 149.99, maxEmployees: 10 },
  business: { name: "Business", price: 249.99, maxEmployees: 30 },
  enterprise: { name: "Enterprise", price: 499.99, maxEmployees: 100 },
} as const

export const SITE_STATUSES = {
  active: { label: "Aktiv", variant: "success" as const },
  paused: { label: "Pausiert", variant: "warning" as const },
  completed: { label: "Abgeschlossen", variant: "neutral" as const },
} as const

export const ORDER_STATUSES = {
  offer: { label: "Angebot", variant: "neutral" as const },
  commissioned: { label: "Beauftragt", variant: "info" as const },
  in_progress: { label: "In Arbeit", variant: "warning" as const },
  acceptance: { label: "Abnahme", variant: "accent" as const },
  completed: { label: "Abgeschlossen", variant: "success" as const },
  complaint: { label: "Reklamation", variant: "danger" as const },
} as const

export const INVOICE_STATUSES = {
  draft: { label: "Entwurf", variant: "neutral" as const },
  sent: { label: "Gesendet", variant: "info" as const },
  paid: { label: "Bezahlt", variant: "success" as const },
  overdue: { label: "Überfällig", variant: "danger" as const },
} as const

export const VEHICLE_TYPE_LABELS = {
  truck: "LKW",
  car: "PKW",
  van: "Transporter",
} as const

export const CONTRACT_TYPE_LABELS = {
  permanent: "Vollzeit",
  parttime: "Teilzeit",
  minijob: "Minijob",
  temporary: "Zeitarbeiter",
  intern: "Praktikant",
} as const

export const WORKER_SUBTYPES = [
  "Baufacharbeiter",
  "Bauhelfer",
  "Maschinist",
  "LKW-Fahrer",
  "Vorarbeiter",
  "Polier",
] as const

export const VEHICLE_STATUSES = {
  available: { label: "Frei", variant: "success" as const },
  in_use: { label: "Im Einsatz", variant: "info" as const },
  workshop: { label: "Werkstatt", variant: "warning" as const },
  reserved: { label: "Reserviert", variant: "accent" as const },
} as const

export const WORKSHOP_STATUSES = {
  received: { label: "Eingegangen", variant: "neutral" as const },
  in_repair: { label: "In Reparatur", variant: "warning" as const },
  done: { label: "Fertig", variant: "success" as const },
  picked_up: { label: "Abgeholt", variant: "info" as const },
} as const

export const MATERIAL_CATEGORIES = [
  "Beton & Zement",
  "Holz & Schalungen",
  "Stahl & Metall",
  "Dämmstoffe",
  "Dachdeckung",
  "Elektro",
  "Sanitär",
  "Farben & Lacke",
  "Werkzeuge",
  "Befestigungen",
  "Bodenbeläge",
  "Mauersteine",
  "Kleingeräte",
  "Verbrauchsmaterial",
  "Sonstige",
] as const

export const EQUIPMENT_TYPES = [
  "Bagger",
  "Radlader",
  "Kran",
  "Rüttler",
  "Betonmischer",
  "Kompressor",
  "Stromerzeuger",
  "Aufzug",
  "Gerüst",
  "Container",
  "Pumpe",
  "Säge",
  "Bohrgerät",
  "Verdichter",
  "Sonstiges",
] as const

export const QUALIFICATION_TYPES = [
  "Führerschein B",
  "Führerschein C",
  "Führerschein CE",
  "Staplerführerschein",
  "Kranführerschein",
  "Baggerführerschein",
  "Ersthelfer",
  "Brandschutzhelfer",
  "Sicherheitsbeauftragter",
  "Gerüstbauer",
  "Schweißer",
  "Sprengberechtigter",
  "Asbestschein",
  "Höhentauglichkeit",
  "Elektrofachkraft",
] as const

export const WEATHER_OPTIONS = [
  { icon: "☀���", label: "Sonnig" },
  { icon: "⛅", label: "Bewölkt" },
  { icon: "🌧️", label: "Regen" },
  { icon: "❄️", label: "Schnee" },
  { icon: "🌫️", label: "Nebel" },
  { icon: "💨", label: "Wind" },
] as const

// ── DRY shared helpers ─────────────────────────────────────────────
// AG employer contribution factor (~22.5%)
export const AG_ANTEIL_PROZENT = 0.225

// Cost category labels (used in orders, sites, cost comparisons)
export const CATEGORY_LABELS: Record<string, string> = {
  personal: "Personal",
  material: "Material",
  equipment: "Geräte",
  vehicles: "Fahrzeuge",
  subcontractor: "Subunternehmer",
  other: "Sonstiges",
}

// Cost category variant mapping for StatusBadge
export const CATEGORY_VARIANTS: Record<string, string> = {
  personal: "info",
  material: "warning",
  equipment: "accent",
  vehicles: "success",
  subcontractor: "danger",
  other: "neutral",
}

// Default budget split for Nachkalkulation SOLL estimation
export const DEFAULT_BUDGET_SPLIT: Record<string, number> = {
  personal: 0.4,
  material: 0.3,
  equipment: 0.1,
  vehicles: 0.05,
  subcontractor: 0.1,
  other: 0.05,
}

// Contract type label resolver (single source of truth)
export function contractLabel(type: string | null | undefined): string {
  if (!type) return "—"
  return CONTRACT_TYPE_LABELS[type as keyof typeof CONTRACT_TYPE_LABELS] ?? type
}

// Site status config resolver (single source of truth)
export function getSiteStatusConfig(status: string) {
  const cfg = SITE_STATUSES[status as keyof typeof SITE_STATUSES]
  return cfg ?? { label: status, variant: "neutral" as const }
}

// Order status config resolver (single source of truth)
export function getOrderStatusConfig(status: string) {
  const cfg = ORDER_STATUSES[status as keyof typeof ORDER_STATUSES]
  return cfg ?? { label: status, variant: "neutral" as const }
}

// Leave status config
export const LEAVE_STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "danger" | "neutral" }> = {
  approved: { label: "Genehmigt", variant: "success" },
  pending: { label: "Ausstehend", variant: "warning" },
  rejected: { label: "Abgelehnt", variant: "danger" },
}

export const LEAVE_TYPES = [
  { value: "vacation", label: "Urlaub" },
  { value: "special", label: "Sonderurlaub" },
  { value: "unpaid", label: "Unbezahlter Urlaub" },
  { value: "care", label: "Pflegezeit" },
  { value: "parental", label: "Elternzeit" },
] as const
