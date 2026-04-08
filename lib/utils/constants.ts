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
  active: { label: "Aktiv", color: "#10b981" },
  paused: { label: "Pausiert", color: "#f59e0b" },
  completed: { label: "Abgeschlossen", color: "#64748b" },
} as const

export const ORDER_STATUSES = {
  offer: { label: "Angebot", color: "#64748b" },
  commissioned: { label: "Beauftragt", color: "#3b82f6" },
  in_progress: { label: "In Arbeit", color: "#f59e0b" },
  acceptance: { label: "Abnahme", color: "#8b5cf6" },
  completed: { label: "Abgeschlossen", color: "#10b981" },
  complaint: { label: "Reklamation", color: "#ef4444" },
} as const

export const INVOICE_STATUSES = {
  draft: { label: "Entwurf", color: "#64748b" },
  sent: { label: "Gesendet", color: "#3b82f6" },
  paid: { label: "Bezahlt", color: "#10b981" },
  overdue: { label: "Überfällig", color: "#ef4444" },
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
  available: { label: "Frei", color: "#10b981" },
  in_use: { label: "Im Einsatz", color: "#3b82f6" },
  workshop: { label: "Werkstatt", color: "#f59e0b" },
  reserved: { label: "Reserviert", color: "#8b5cf6" },
} as const

export const WORKSHOP_STATUSES = {
  received: { label: "Eingegangen", color: "#64748b" },
  in_repair: { label: "In Reparatur", color: "#f59e0b" },
  done: { label: "Fertig", color: "#10b981" },
  picked_up: { label: "Abgeholt", color: "#3b82f6" },
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
  { icon: "☀️", label: "Sonnig" },
  { icon: "⛅", label: "Bewölkt" },
  { icon: "🌧️", label: "Regen" },
  { icon: "❄️", label: "Schnee" },
  { icon: "🌫️", label: "Nebel" },
  { icon: "💨", label: "Wind" },
] as const
