"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Hammer,
  HardHat,
  Info,
  Moon,
  Package,
  Sun,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"

// ── Section wrapper ────────────────────────────────────────────────
function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="space-y-4 scroll-mt-24">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="rounded-xl border bg-card p-6 ring-1 ring-foreground/5">
        {children}
      </div>
    </section>
  )
}

// ── Color swatch ───────────────────────────────────────────────────
function Swatch({
  name,
  tokenVar,
  textClass,
}: {
  name: string
  tokenVar: string
  textClass?: string
}) {
  return (
    <div className="space-y-2">
      <div
        className={`h-20 w-full rounded-lg ring-1 ring-foreground/10 ${textClass ?? ""}`}
        style={{ background: `var(${tokenVar})` }}
      />
      <div className="space-y-0.5">
        <div className="text-xs font-medium">{name}</div>
        <div className="font-mono-numbers text-[10px] text-muted-foreground">
          {tokenVar}
        </div>
      </div>
    </div>
  )
}

// ── Theme toggle ───────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const current = mounted ? resolvedTheme : "light"
  const next = current === "dark" ? "light" : "dark"

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(next)}
      aria-label={`Zu ${next} mode wechseln`}
    >
      {current === "dark" ? (
        <>
          <Sun /> Light
        </>
      ) : (
        <>
          <Moon /> Dark
        </>
      )}
      <span className="ml-1 text-xs text-muted-foreground">
        ({theme ?? "system"})
      </span>
    </Button>
  )
}

// ── Main ───────────────────────────────────────────────────────────
export function DesignSystemClient() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex size-9 items-center justify-center rounded-lg text-primary-foreground"
              style={{ background: "var(--primary)" }}
            >
              <HardHat className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">
                NomadWorks Design System
              </h1>
              <p className="text-xs text-muted-foreground">
                v3 — Baustelle Modern
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-6 py-10">
        {/* Intro */}
        <div className="space-y-3">
          <Badge variant="secondary">Phase V3-1 · Sarah Chen</Badge>
          <h1 className="text-4xl font-bold tracking-tight">
            Baustelle Modern
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Slate als neutraler Primary, Safety Orange als Accent. Plus Jakarta
            Sans für Heading und Body. Dark Mode gleichrangig ausgebaut. Alle
            Tokens in <code className="font-mono-numbers">app/globals.css</code>.
          </p>
        </div>

        {/* Colors */}
        <Section
          id="colors"
          title="Farben"
          description="Tokens verweisen auf CSS-Variablen — Dark Mode funktioniert automatisch."
        >
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Brand
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Swatch name="Primary (Slate)" tokenVar="--primary" />
                <Swatch name="Accent (Orange)" tokenVar="--accent" />
                <Swatch name="Background" tokenVar="--background" />
                <Swatch name="Foreground" tokenVar="--foreground" />
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Surfaces
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Swatch name="Card" tokenVar="--card" />
                <Swatch name="Muted" tokenVar="--muted" />
                <Swatch name="Border" tokenVar="--border" />
                <Swatch name="Ring (Focus)" tokenVar="--ring" />
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Semantic
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Swatch name="Success" tokenVar="--success" />
                <Swatch name="Warning" tokenVar="--warning" />
                <Swatch name="Danger" tokenVar="--danger" />
                <Swatch name="Destructive" tokenVar="--destructive" />
              </div>
            </div>
          </div>
        </Section>

        {/* Typography */}
        <Section
          id="typography"
          title="Typografie"
          description="Plus Jakarta Sans — Heading und Body aus einer Familie."
        >
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Display / H1
              </div>
              <p className="text-5xl font-bold tracking-tight">
                Baustelle Modern
              </p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                H2
              </div>
              <p className="text-3xl font-bold tracking-tight">
                ERP für Bauunternehmer
              </p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                H3
              </div>
              <p className="text-2xl font-semibold">Disposition & Zeiterfassung</p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                H4
              </div>
              <p className="text-xl font-semibold">Rechnung Nr. RE-2026-0042</p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Body
              </div>
              <p className="text-base">
                Heute 7 Mitarbeiter auf 3 Baustellen. Zwei neue Bautagesberichte
                wurden erstellt, eine Rechnung wartet auf Freigabe.
              </p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Caption
              </div>
              <p className="text-xs text-muted-foreground">
                Zuletzt aktualisiert vor 4 Minuten
              </p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Mono / Tabular
              </div>
              <p className="font-mono-numbers text-base">
                1.234.567,89 EUR · RE-2026-0042
              </p>
            </div>
          </div>
        </Section>

        {/* Spacing */}
        <Section id="spacing" title="Spacing" description="4 · 8 · 12 · 16 · 24 · 32 · 48 px">
          <div className="flex items-end gap-4">
            {[4, 8, 12, 16, 24, 32, 48].map((px) => (
              <div key={px} className="flex flex-col items-center gap-2">
                <div
                  className="rounded bg-primary"
                  style={{ width: `${px}px`, height: `${px}px` }}
                />
                <span className="font-mono-numbers text-xs text-muted-foreground">
                  {px}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Radii */}
        <Section id="radii" title="Radii" description="sm · md · lg · xl">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { name: "sm", cls: "rounded-sm" },
              { name: "md", cls: "rounded-md" },
              { name: "lg", cls: "rounded-lg" },
              { name: "xl", cls: "rounded-xl" },
            ].map(({ name, cls }) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div className={`h-20 w-20 bg-primary ${cls}`} />
                <span className="font-mono-numbers text-xs text-muted-foreground">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Shadows */}
        <Section id="shadows" title="Shadows" description="sm · md · lg · xl">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { name: "sm", cls: "shadow-sm" },
              { name: "md", cls: "shadow-md" },
              { name: "lg", cls: "shadow-lg" },
              { name: "xl", cls: "shadow-xl" },
            ].map(({ name, cls }) => (
              <div key={name} className="flex flex-col items-center gap-3 py-4">
                <div className={`h-20 w-20 rounded-lg bg-card ring-1 ring-foreground/5 ${cls}`} />
                <span className="font-mono-numbers text-xs text-muted-foreground">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Buttons */}
        <Section
          id="buttons"
          title="Buttons"
          description="Primary, Secondary, Outline, Ghost, Destructive, Link — alle States."
        >
          <div className="space-y-6">
            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Variants
              </div>
              <div className="flex flex-wrap gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Mit Icon
              </div>
              <div className="flex flex-wrap gap-3">
                <Button>
                  <FileText /> Neuer Auftrag
                </Button>
                <Button variant="outline">
                  <Users /> Mitarbeiter hinzufügen
                </Button>
                <Button variant="destructive">
                  <XCircle /> Stornieren
                </Button>
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Größen
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs">xs</Button>
                <Button size="sm">sm</Button>
                <Button>default</Button>
                <Button size="lg">lg</Button>
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Disabled
              </div>
              <div className="flex flex-wrap gap-3">
                <Button disabled>Primary</Button>
                <Button variant="outline" disabled>
                  Outline
                </Button>
                <Button variant="destructive" disabled>
                  Destructive
                </Button>
              </div>
            </div>
          </div>
        </Section>

        {/* Cards & StatCards */}
        <Section id="cards" title="Cards" description="Basis-Card, StatCard, Empty-State.">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Mitarbeiter heute"
                value="7"
                context="auf 3 Baustellen"
                icon={Users}
                trend={{ value: 12, label: "ggü. letzter Woche" }}
              />
              <StatCard
                title="Offene Stunden"
                value="124"
                context="diese Woche"
                icon={Clock}
              />
              <StatCard
                title="Aktive Baustellen"
                value="3"
                context="von 5 gesamt"
                icon={Hammer}
              />
              <StatCard
                title="Offene Rechnungen"
                value="8.450,00 €"
                context="überfällig: 2"
                icon={TrendingUp}
                trend={{ value: -5, label: "ggü. Vormonat" }}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Baustelle Ecke Hauptstr./Feldweg</CardTitle>
                  <CardDescription>
                    Rohbau · Team Müller · seit 12. März
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Drei Mitarbeiter aktiv. Letzter Bautagesbericht wurde heute
                    um 07:42 Uhr erstellt.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Nur Titel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="size-4 text-accent" />
                    <span>Letztes Update vor 4 Minuten</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Section>

        {/* DataTable */}
        <Section id="table" title="DataTable" description="Demo-Tabelle mit Badges und mono-tabular numbers.">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nr.</TableHead>
                <TableHead>Baustelle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Summe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  nr: "RE-2026-0042",
                  site: "Hauptstr. 12",
                  status: "success" as const,
                  label: "Bezahlt",
                  team: "Müller",
                  sum: "12.450,00 €",
                },
                {
                  nr: "RE-2026-0043",
                  site: "Feldweg 3",
                  status: "warning" as const,
                  label: "Fällig",
                  team: "Schulz",
                  sum: "4.820,00 €",
                },
                {
                  nr: "RE-2026-0044",
                  site: "Bahnhofstr. 7",
                  status: "danger" as const,
                  label: "Überfällig",
                  team: "Müller",
                  sum: "8.200,00 €",
                },
                {
                  nr: "RE-2026-0045",
                  site: "Gartenallee 22",
                  status: "info" as const,
                  label: "Entwurf",
                  team: "Weber",
                  sum: "—",
                },
                {
                  nr: "RE-2026-0046",
                  site: "Parkring 5",
                  status: "success" as const,
                  label: "Bezahlt",
                  team: "Schulz",
                  sum: "3.100,00 €",
                },
              ].map((row) => (
                <TableRow key={row.nr}>
                  <TableCell className="font-mono-numbers">{row.nr}</TableCell>
                  <TableCell>{row.site}</TableCell>
                  <TableCell>
                    <StatusBadge label={row.label} variant={row.status} />
                  </TableCell>
                  <TableCell>{row.team}</TableCell>
                  <TableCell className="text-right font-mono-numbers">
                    {row.sum}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        {/* Badges */}
        <Section id="badges" title="Badges" description="shadcn/ui Badge + NomadWorks StatusBadge.">
          <div className="space-y-6">
            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                shadcn Badge
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="ghost">Ghost</Badge>
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                StatusBadge (Semantic)
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge label="Aktiv" variant="success" />
                <StatusBadge label="Fällig" variant="warning" />
                <StatusBadge label="Überfällig" variant="danger" />
                <StatusBadge label="Entwurf" variant="info" />
                <StatusBadge label="Neutral" variant="neutral" />
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Icon-Badges
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <CheckCircle2 /> Erledigt
                </Badge>
                <Badge variant="secondary">
                  <AlertTriangle /> Achtung
                </Badge>
                <Badge variant="secondary">
                  <Info /> Info
                </Badge>
              </div>
            </div>
          </div>
        </Section>

        {/* Forms */}
        <Section id="forms" title="Forms" description="Input, Textarea, Select, Checkbox.">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ds-name">Name</Label>
              <Input id="ds-name" placeholder="Max Mustermann" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ds-email">E-Mail</Label>
              <Input id="ds-email" type="email" placeholder="max@example.com" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ds-notes">Notizen</Label>
              <Textarea
                id="ds-notes"
                placeholder="Bemerkungen zum Bautagesbericht…"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ds-select">Baustelle</Label>
              <Select>
                <SelectTrigger id="ds-select">
                  <SelectValue placeholder="Baustelle wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hauptstr">Hauptstr. 12</SelectItem>
                  <SelectItem value="feldweg">Feldweg 3</SelectItem>
                  <SelectItem value="bahnhof">Bahnhofstr. 7</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Checkbox id="ds-confirm" />
              <Label htmlFor="ds-confirm" className="cursor-pointer">
                Stunden bestätigt und freigegeben
              </Label>
            </div>
          </div>
        </Section>

        {/* Empty State */}
        <Section
          id="empty"
          title="Empty State"
          description="Standard-Placeholder wenn noch keine Daten vorhanden sind."
        >
          <EmptyState
            icon={Package}
            title="Noch keine Einträge"
            description="Lege deinen ersten Eintrag an — alle weiteren erscheinen dann hier."
            action={{
              label: "Neuer Eintrag",
              onClick: () => {},
            }}
          />
        </Section>

        {/* Footer */}
        <footer className="border-t pt-6 text-center text-xs text-muted-foreground">
          NomadWorks v3 Design System · Sarah Chen · Baustelle Modern
        </footer>
      </main>
    </div>
  )
}
