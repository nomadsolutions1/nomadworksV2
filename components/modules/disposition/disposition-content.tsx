"use client"

import { useState } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Sun, BarChart3, Users, Clock } from "lucide-react"
import { WeekGrid } from "./week-grid"
import { DayView } from "./day-view"
import { TimelineView } from "./timeline-view"
import { CapacityView } from "./capacity-view"
import { getTodayString } from "@/lib/utils/dates"
import type { Assignment, EmployeeCapacity } from "@/lib/actions/disposition"

interface Employee {
  id: string
  first_name: string
  last_name: string
}

interface Site {
  id: string
  name: string
  status: string
}

interface DispositionContentProps {
  assignments: Assignment[]
  capacities: EmployeeCapacity[]
  employees: Employee[]
  sites: Site[]
  weekStart: string
}

export function DispositionContent({
  assignments,
  capacities,
  employees,
  sites,
  weekStart,
}: DispositionContentProps) {
  const [activeTab, setActiveTab] = useState("wochenplan")
  const [dayDate, setDayDate] = useState(getTodayString)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disposition"
        description="Planen Sie die Einsaetze Ihrer Mitarbeiter und ueberblicken Sie die Auslastung."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="wochenplan" className="rounded-lg flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Wochenplan
          </TabsTrigger>
          <TabsTrigger value="tag" className="rounded-lg flex items-center gap-1.5">
            <Sun className="h-3.5 w-3.5" />
            Tagesansicht
          </TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-lg flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="kapazitaet" className="rounded-lg flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Kapazitaet
          </TabsTrigger>
          <TabsTrigger value="zeiten" className="rounded-lg flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Zeituebersicht
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wochenplan" className="mt-4">
          <WeekGrid
            assignments={assignments}
            employees={employees}
            sites={sites}
            weekStart={weekStart}
          />
        </TabsContent>

        <TabsContent value="tag" className="mt-4">
          <DayView
            date={dayDate}
            assignments={assignments}
            onDateChange={setDayDate}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <TimelineView
            date={dayDate}
            assignments={assignments}
            employees={employees.map((e) => ({
              id: e.id,
              name: `${e.first_name} ${e.last_name}`,
            }))}
            onDateChange={setDayDate}
          />
        </TabsContent>

        <TabsContent value="kapazitaet" className="mt-4">
          <CapacityView capacities={capacities} sites={sites} />
        </TabsContent>

        <TabsContent value="zeiten" className="mt-4">
          <div className="text-center py-12 text-sm text-muted-foreground">
            <a
              href="/disposition/zeiterfassung"
              className="text-primary hover:underline font-medium"
            >
              Zur Zeituebersicht
            </a>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
