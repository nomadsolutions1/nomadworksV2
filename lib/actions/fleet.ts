"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { withAuth } from "@/lib/utils/auth-helper"
import { trackError } from "@/lib/utils/error-tracker"
import { logActivity } from "@/lib/utils/activity-logger"
import type { Database } from "@/lib/types/database"

// ─── DB Row Shortcuts (fully typed — no AnyRow) ───────────────
type VehicleRow = Database["public"]["Tables"]["vehicles"]["Row"]
type EquipmentRow = Database["public"]["Tables"]["equipment"]["Row"]
type FuelLogRow = Database["public"]["Tables"]["fuel_logs"]["Row"]
type TripLogRow = Database["public"]["Tables"]["trip_logs"]["Row"]
type EquipmentCostRow = Database["public"]["Tables"]["equipment_costs"]["Row"]
type WorkshopEntryRow = Database["public"]["Tables"]["workshop_entries"]["Row"]

// ─── Public Types ─────────────────────────────────────────────

export type Vehicle = VehicleRow
export type Equipment = EquipmentRow
export type FuelEntry = FuelLogRow
export type TripEntry = TripLogRow
export type EquipmentCost = EquipmentCostRow
export type WorkshopEntry = WorkshopEntryRow

export type FleetStats = {
  totalVehicles: number
  availableVehicles: number
  workshopVehicles: number
  totalEquipment: number
  availableEquipment: number
  activeWorkshop: number
  tuevWarnings: number
  maintenanceWarnings: number
}

// ─── Zod Schemas ──────────────────────────────────────────────

const decimalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? parseFloat(v.replace(",", ".")) : null))

const intString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? parseInt(v, 10) : null))

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v : null))

const vehicleSchema = z.object({
  license_plate: z.string().min(1, "Kennzeichen ist erforderlich"),
  make: z.string().min(1, "Hersteller ist erforderlich"),
  model: z.string().min(1, "Modell ist erforderlich"),
  year: intString,
  type: z.string().min(1, "Fahrzeugtyp ist erforderlich"),
  mileage: intString,
  status: optionalString,
  availability_status: optionalString,
  leasing_cost: decimalString,
  insurance_cost: decimalString,
  tax_cost: decimalString,
  next_inspection: optionalString,
  acquisition_type: optionalString,
  purchase_price: decimalString,
  purchase_date: optionalString,
  monthly_rate: decimalString,
  contract_start: optionalString,
  contract_end: optionalString,
  down_payment: decimalString,
  residual_value: decimalString,
  interest_rate: decimalString,
  loan_amount: decimalString,
  rental_daily_rate: decimalString,
})

const equipmentSchema = z.object({
  name: z.string().min(1, "Bezeichnung ist erforderlich"),
  category: z.string().min(1, "Typ ist erforderlich"),
  serial_number: optionalString,
  purchase_date: optionalString,
  purchase_price: decimalString,
  daily_rate: decimalString,
  status: optionalString,
  availability_status: optionalString,
  next_maintenance: optionalString,
})

const fuelEntrySchema = z.object({
  date: z.string().min(1, "Datum ist erforderlich"),
  liters: z.string().min(1, "Liter ist erforderlich").transform((v) => parseFloat(v.replace(",", "."))),
  cost: z.string().min(1, "Kosten ist erforderlich").transform((v) => parseFloat(v.replace(",", "."))),
  mileage: intString,
})

const tripEntrySchema = z.object({
  date: z.string().min(1, "Datum ist erforderlich"),
  start_location: z.string().min(1, "Startort ist erforderlich"),
  end_location: z.string().min(1, "Zielort ist erforderlich"),
  km: z.string().min(1, "Kilometer ist erforderlich").transform((v) => parseFloat(v.replace(",", "."))),
  purpose: z.string().min(1, "Zweck ist erforderlich"),
})

const equipmentCostSchema = z.object({
  equipment_id: z.string().min(1, "Maschine ist erforderlich"),
  date: z.string().min(1, "Datum ist erforderlich"),
  type: z.string().min(1, "Kostentyp ist erforderlich"),
  amount: z.string().min(1, "Betrag ist erforderlich").transform((v) => parseFloat(v.replace(",", "."))),
  description: optionalString,
})

const workshopEntrySchema = z.object({
  entity_id: z.string().min(1, "Fahrzeug oder Maschine ist erforderlich"),
  entity_type: z.enum(["vehicle", "equipment"]),
  reason: z.string().min(1, "Grund ist erforderlich"),
  description: optionalString,
  entered_at: z.string().min(1, "Eingangsdatum ist erforderlich"),
  expected_completion: optionalString,
  cost_parts: decimalString,
  cost_labor: decimalString,
  cost_external: decimalString,
  workshop_name: optionalString,
  notes: optionalString,
})

// ─── Vehicles ─────────────────────────────────────────────────

export async function listVehicles(): Promise<{ data?: Vehicle[]; error?: string }> {
  return withAuth("fuhrpark", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("vehicles")
      .select("*")
      .eq("company_id", profile.company_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      trackError("fleet", "listVehicles", error.message, { table: "vehicles" })
      return { error: "Fahrzeuge konnten nicht geladen werden" }
    }
    return { data: (data ?? []) as Vehicle[] }
  }) as Promise<{ data?: Vehicle[]; error?: string }>
}

export async function getVehicle(id: string): Promise<{ data?: Vehicle; error?: string }> {
  return withAuth("fuhrpark", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("vehicles")
      .select("*")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .is("deleted_at", null)
      .single()

    if (error || !data) {
      trackError("fleet", "getVehicle", error?.message ?? "not found", { table: "vehicles", id })
      return { error: "Fahrzeug nicht gefunden" }
    }
    return { data: data as Vehicle }
  }) as Promise<{ data?: Vehicle; error?: string }>
}

export async function createVehicle(
  formData: FormData
): Promise<{ success?: boolean; id?: string; error?: string | Record<string, string[]> }> {
  return withAuth("fuhrpark", "write", async ({ user, profile, db }) => {
    const validated = vehicleSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const v = validated.data
    const { data, error } = await db
      .from("vehicles")
      .insert({
        company_id: profile.company_id,
        license_plate: v.license_plate,
        make: v.make,
        model: v.model,
        year: v.year,
        type: v.type,
        mileage: v.mileage,
        status: v.status ?? "available",
        availability_status: v.availability_status ?? "available",
        leasing_cost: v.leasing_cost,
        insurance_cost: v.insurance_cost,
        tax_cost: v.tax_cost,
        next_inspection: v.next_inspection,
        acquisition_type: v.acquisition_type,
        purchase_price: v.purchase_price,
        purchase_date: v.purchase_date,
        monthly_rate: v.monthly_rate,
        contract_start: v.contract_start,
        contract_end: v.contract_end,
        down_payment: v.down_payment,
        residual_value: v.residual_value,
        interest_rate: v.interest_rate,
        loan_amount: v.loan_amount,
        rental_daily_rate: v.rental_daily_rate,
      })
      .select("id")
      .single()

    if (error || !data) {
      trackError("fleet", "createVehicle", error?.message ?? "insert failed", { table: "vehicles" })
      return { error: "Fahrzeug konnte nicht angelegt werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "vehicle",
      entityId: data.id,
      title: `Fahrzeug ${v.make} ${v.model} (${v.license_plate}) angelegt`,
    })

    revalidatePath("/fuhrpark")
    revalidatePath("/fuhrpark/fahrzeuge")
    return { success: true, id: data.id }
  }) as Promise<{ success?: boolean; id?: string; error?: string | Record<string, string[]> }>
}

export async function updateVehicle(
  id: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("fuhrpark", "write", async ({ user, profile, db }) => {
    const validated = vehicleSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const v = validated.data
    const { error } = await db
      .from("vehicles")
      .update({
        license_plate: v.license_plate,
        make: v.make,
        model: v.model,
        year: v.year,
        type: v.type,
        mileage: v.mileage,
        status: v.status ?? "available",
        availability_status: v.availability_status ?? "available",
        leasing_cost: v.leasing_cost,
        insurance_cost: v.insurance_cost,
        tax_cost: v.tax_cost,
        next_inspection: v.next_inspection,
        acquisition_type: v.acquisition_type,
        purchase_price: v.purchase_price,
        purchase_date: v.purchase_date,
        monthly_rate: v.monthly_rate,
        contract_start: v.contract_start,
        contract_end: v.contract_end,
        down_payment: v.down_payment,
        residual_value: v.residual_value,
        interest_rate: v.interest_rate,
        loan_amount: v.loan_amount,
        rental_daily_rate: v.rental_daily_rate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("fleet", "updateVehicle", error.message, { table: "vehicles", id })
      return { error: "Änderungen konnten nicht gespeichert werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "vehicle",
      entityId: id,
      title: `Fahrzeug ${v.make} ${v.model} (${v.license_plate}) aktualisiert`,
    })

    revalidatePath("/fuhrpark")
    revalidatePath("/fuhrpark/fahrzeuge")
    revalidatePath(`/fuhrpark/fahrzeuge/${id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

export async function deleteVehicle(id: string): Promise<{ success?: boolean; error?: string }> {
  return withAuth("fuhrpark", "write", async ({ user, profile, db }) => {
    if (profile.role !== "owner") return { error: "Nur Geschäftsführer können Fahrzeuge löschen" }

    const { data: vehicle } = await db
      .from("vehicles")
      .select("license_plate, make, model")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    const { error } = await db
      .from("vehicles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("fleet", "deleteVehicle", error.message, { table: "vehicles", id })
      return { error: "Fahrzeug konnte nicht gelöscht werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "vehicle",
      entityId: id,
      title: vehicle
        ? `Fahrzeug ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) gelöscht`
        : "Fahrzeug gelöscht",
    })

    revalidatePath("/fuhrpark")
    revalidatePath("/fuhrpark/fahrzeuge")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

export async function assignVehicle(
  id: string,
  userId: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("fuhrpark", "write", async ({ user, profile, db }) => {
    // Verify assignee belongs to same company (defense in depth)
    const { data: target } = await db
      .from("profiles")
      .select("id, company_id, first_name, last_name")
      .eq("id", userId)
      .eq("company_id", profile.company_id)
      .single()

    if (!target) return { error: "Mitarbeiter nicht gefunden" }

    const { error } = await db
      .from("vehicles")
      .update({
        assigned_to: userId,
        availability_status: "in_use",
        status: "in_use",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("fleet", "assignVehicle", error.message, { table: "vehicles", id })
      return { error: "Zuweisung fehlgeschlagen" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "assign",
      entityType: "vehicle",
      entityId: id,
      title: `Fahrzeug ${target.first_name} ${target.last_name} zugewiesen`,
    })

    revalidatePath("/fuhrpark")
    revalidatePath(`/fuhrpark/fahrzeuge/${id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

export async function unassignVehicle(id: string): Promise<{ success?: boolean; error?: string }> {
  return withAuth("fuhrpark", "write", async ({ user, profile, db }) => {
    const { error } = await db
      .from("vehicles")
      .update({
        assigned_to: null,
        availability_status: "available",
        status: "available",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("fleet", "unassignVehicle", error.message, { table: "vehicles", id })
      return { error: "Zuweisung konnte nicht aufgehoben werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "unassign",
      entityType: "vehicle",
      entityId: id,
      title: "Fahrzeug-Zuweisung aufgehoben",
    })

    revalidatePath("/fuhrpark")
    revalidatePath(`/fuhrpark/fahrzeuge/${id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Fuel Logs ────────────────────────────────────────────────

export async function listFuelLogs(vehicleId: string): Promise<{ data?: FuelEntry[]; error?: string }> {
  return withAuth("fuhrpark", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("fuel_logs")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .eq("company_id", profile.company_id)
      .order("date", { ascending: false })

    if (error) {
      trackError("fleet", "listFuelLogs", error.message, { table: "fuel_logs" })
      return { error: "Tankbuch konnte nicht geladen werden" }
    }
    return { data: (data ?? []) as FuelEntry[] }
  }) as Promise<{ data?: FuelEntry[]; error?: string }>
}

export async function createFuelLog(
  vehicleId: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("fuhrpark", "write", async ({ user, profile, db }) => {
    const validated = fuelEntrySchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const v = validated.data

    // Ownership check: does vehicle belong to same company?
    const { data: vehicle } = await db
      .from("vehicles")
      .select("id, license_plate")
      .eq("id", vehicleId)
      .eq("company_id", profile.company_id)
      .single()

    if (!vehicle) return { error: "Fahrzeug nicht gefunden" }

    const { error } = await db.from("fuel_logs").insert({
      vehicle_id: vehicleId,
      company_id: profile.company_id,
      date: v.date,
      liters: v.liters,
      cost: v.cost,
      mileage: v.mileage,
    })

    if (error) {
      trackError("fleet", "createFuelLog", error.message, { table: "fuel_logs" })
      return { error: "Tankeintrag konnte nicht gespeichert werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "fuel_log",
      title: `Tankeintrag ${vehicle.license_plate}: ${v.liters} L / ${v.cost} €`,
    })

    revalidatePath(`/fuhrpark/fahrzeuge/${vehicleId}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

export async function deleteFuelLog(
  entryId: string,
  vehicleId: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("fuhrpark", "write", async ({ user, profile, db }) => {
    const { error } = await db
      .from("fuel_logs")
      .delete()
      .eq("id", entryId)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("fleet", "deleteFuelLog", error.message, { table: "fuel_logs", entryId })
      return { error: "Tankeintrag konnte nicht gelöscht werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "fuel_log",
      entityId: entryId,
      title: "Tankeintrag gelöscht",
    })

    revalidatePath(`/fuhrpark/fahrzeuge/${vehicleId}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Trip Logs ────────────────────────────────────────────────

export async function listTripLogs(vehicleId: string): Promise<{ data?: TripEntry[]; error?: string }> {
  return withAuth("fuhrpark", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("trip_logs")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .eq("company_id", profile.company_id)
      .order("date", { ascending: false })

    if (error) {
      trackError("fleet", "listTripLogs", error.message, { table: "trip_logs" })
      return { error: "Fahrtenbuch konnte nicht geladen werden" }
    }
    return { data: (data ?? []) as TripEntry[] }
  }) as Promise<{ data?: TripEntry[]; error?: string }>
}

export async function createTripLog(
  vehicleId: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("fuhrpark", "write", async ({ user, profile, db }) => {
    const validated = tripEntrySchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const v = validated.data
    if (v.km <= 0) return { error: "Kilometer muss größer als 0 sein" }

    // Ownership check
    const { data: vehicle } = await db
      .from("vehicles")
      .select("id, license_plate")
      .eq("id", vehicleId)
      .eq("company_id", profile.company_id)
      .single()

    if (!vehicle) return { error: "Fahrzeug nicht gefunden" }

    const { error } = await db.from("trip_logs").insert({
      vehicle_id: vehicleId,
      company_id: profile.company_id,
      driver_id: user.id,
      date: v.date,
      start_location: v.start_location,
      end_location: v.end_location,
      km: v.km,
      purpose: v.purpose,
    })

    if (error) {
      trackError("fleet", "createTripLog", error.message, { table: "trip_logs" })
      return { error: "Fahrt konnte nicht gespeichert werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "trip_log",
      title: `Fahrt ${vehicle.license_plate}: ${v.start_location} → ${v.end_location} (${v.km} km)`,
    })

    revalidatePath(`/fuhrpark/fahrzeuge/${vehicleId}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

export async function deleteTripLog(
  entryId: string,
  vehicleId: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("fuhrpark", "write", async ({ user, profile, db }) => {
    const { error } = await db
      .from("trip_logs")
      .delete()
      .eq("id", entryId)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("fleet", "deleteTripLog", error.message, { table: "trip_logs", entryId })
      return { error: "Fahrt konnte nicht gelöscht werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "trip_log",
      entityId: entryId,
      title: "Fahrteintrag gelöscht",
    })

    revalidatePath(`/fuhrpark/fahrzeuge/${vehicleId}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Equipment ────────────────────────────────────────────────

export async function listEquipment(): Promise<{ data?: Equipment[]; error?: string }> {
  return withAuth("fuhrpark", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("equipment")
      .select("*")
      .eq("company_id", profile.company_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      trackError("fleet", "listEquipment", error.message, { table: "equipment" })
      return { error: "Maschinen konnten nicht geladen werden" }
    }
    return { data: (data ?? []) as Equipment[] }
  }) as Promise<{ data?: Equipment[]; error?: string }>
}

export async function getEquipment(id: string): Promise<{ data?: Equipment; error?: string }> {
  return withAuth("fuhrpark", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("equipment")
      .select("*")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .is("deleted_at", null)
      .single()

    if (error || !data) {
      trackError("fleet", "getEquipment", error?.message ?? "not found", { table: "equipment", id })
      return { error: "Maschine nicht gefunden" }
    }
    return { data: data as Equipment }
  }) as Promise<{ data?: Equipment; error?: string }>
}

export async function createEquipment(
  formData: FormData
): Promise<{ success?: boolean; id?: string; error?: string | Record<string, string[]> }> {
  return withAuth("fuhrpark", "write", async ({ user, profile, db }) => {
    const validated = equipmentSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const v = validated.data
    const { data, error } = await db
      .from("equipment")
      .insert({
        company_id: profile.company_id,
        name: v.name,
        category: v.category,
        serial_number: v.serial_number,
        purchase_date: v.purchase_date,
        purchase_price: v.purchase_price,
        daily_rate: v.daily_rate,
        status: v.status ?? "available",
        availability_status: v.availability_status ?? "available",
        next_maintenance: v.next_maintenance,
      })
      .select("id")
      .single()

    if (error || !data) {
      trackError("fleet", "createEquipment", error?.message ?? "insert failed", { table: "equipment" })
      return { error: "Maschine konnte nicht angelegt werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "equipment",
      entityId: data.id,
      title: `Maschine "${v.name}" angelegt`,
    })

    revalidatePath("/fuhrpark")
    revalidatePath("/fuhrpark/maschinen")
    return { success: true, id: data.id }
  }) as Promise<{ success?: boolean; id?: string; error?: string | Record<string, string[]> }>
}

export async function updateEquipment(
  id: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("fuhrpark", "write", async ({ user, profile, db }) => {
    const validated = equipmentSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const v = validated.data
    const { error } = await db
      .from("equipment")
      .update({
        name: v.name,
        category: v.category,
        serial_number: v.serial_number,
        purchase_date: v.purchase_date,
        purchase_price: v.purchase_price,
        daily_rate: v.daily_rate,
        status: v.status ?? "available",
        availability_status: v.availability_status ?? "available",
        next_maintenance: v.next_maintenance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("fleet", "updateEquipment", error.message, { table: "equipment", id })
      return { error: "Änderungen konnten nicht gespeichert werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "equipment",
      entityId: id,
      title: `Maschine "${v.name}" aktualisiert`,
    })

    revalidatePath("/fuhrpark")
    revalidatePath("/fuhrpark/maschinen")
    revalidatePath(`/fuhrpark/maschinen/${id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

export async function deleteEquipment(id: string): Promise<{ success?: boolean; error?: string }> {
  return withAuth("fuhrpark", "write", async ({ user, profile, db }) => {
    if (profile.role !== "owner") return { error: "Nur Geschäftsführer können Maschinen löschen" }

    const { data: eq } = await db
      .from("equipment")
      .select("name")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    const { error } = await db
      .from("equipment")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("fleet", "deleteEquipment", error.message, { table: "equipment", id })
      return { error: "Maschine konnte nicht gelöscht werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "delete",
      entityType: "equipment",
      entityId: id,
      title: eq ? `Maschine "${eq.name}" gelöscht` : "Maschine gelöscht",
    })

    revalidatePath("/fuhrpark")
    revalidatePath("/fuhrpark/maschinen")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

export async function assignEquipment(
  id: string,
  siteId: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("fuhrpark", "write", async ({ user, profile, db }) => {
    // Verify site ownership (defense in depth)
    const { data: site } = await db
      .from("construction_sites")
      .select("id, name")
      .eq("id", siteId)
      .eq("company_id", profile.company_id)
      .single()

    if (!site) return { error: "Baustelle nicht gefunden" }

    const { error } = await db
      .from("equipment")
      .update({
        assigned_site: siteId,
        availability_status: "in_use",
        status: "in_use",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("fleet", "assignEquipment", error.message, { table: "equipment", id })
      return { error: "Zuweisung fehlgeschlagen" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "assign",
      entityType: "equipment",
      entityId: id,
      title: `Maschine Baustelle "${site.name}" zugewiesen`,
    })

    revalidatePath("/fuhrpark")
    revalidatePath(`/fuhrpark/maschinen/${id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

export async function unassignEquipment(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("fuhrpark", "write", async ({ user, profile, db }) => {
    const { error } = await db
      .from("equipment")
      .update({
        assigned_site: null,
        availability_status: "available",
        status: "available",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("fleet", "unassignEquipment", error.message, { table: "equipment", id })
      return { error: "Zuweisung konnte nicht aufgehoben werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "unassign",
      entityType: "equipment",
      entityId: id,
      title: "Maschinen-Zuweisung aufgehoben",
    })

    revalidatePath("/fuhrpark")
    revalidatePath(`/fuhrpark/maschinen/${id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

// ─── Equipment Costs ──────────────────────────────────────────

export async function listEquipmentCosts(
  equipmentId?: string
): Promise<{ data?: EquipmentCost[]; error?: string }> {
  return withAuth("fuhrpark", "read", async ({ profile, db }) => {
    let query = db
      .from("equipment_costs")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("date", { ascending: false })

    if (equipmentId) query = query.eq("equipment_id", equipmentId)

    const { data, error } = await query

    if (error) {
      trackError("fleet", "listEquipmentCosts", error.message, { table: "equipment_costs" })
      return { error: "Maschinenkosten konnten nicht geladen werden" }
    }
    return { data: (data ?? []) as EquipmentCost[] }
  }) as Promise<{ data?: EquipmentCost[]; error?: string }>
}

export async function createEquipmentCost(
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  return withAuth("fuhrpark", "write", async ({ user, profile, db }) => {
    const validated = equipmentCostSchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const v = validated.data

    // Ownership check
    const { data: eq } = await db
      .from("equipment")
      .select("id, name")
      .eq("id", v.equipment_id)
      .eq("company_id", profile.company_id)
      .single()

    if (!eq) return { error: "Maschine nicht gefunden" }

    const { error } = await db.from("equipment_costs").insert({
      company_id: profile.company_id,
      equipment_id: v.equipment_id,
      date: v.date,
      type: v.type,
      amount: v.amount,
      description: v.description,
    })

    if (error) {
      trackError("fleet", "createEquipmentCost", error.message, { table: "equipment_costs" })
      return { error: "Kostenbuchung konnte nicht gespeichert werden" }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "equipment_cost",
      title: `Kosten für "${eq.name}": ${v.amount} € (${v.type})`,
    })

    revalidatePath(`/fuhrpark/maschinen/${v.equipment_id}`)
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string | Record<string, string[]> }>
}

// ─── Workshop Entries ─────────────────────────────────────────

export async function listWorkshopEntries(): Promise<{ data?: WorkshopEntry[]; error?: string }> {
  return withAuth("fuhrpark", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("workshop_entries")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("entered_at", { ascending: false })

    if (error) {
      trackError("fleet", "listWorkshopEntries", error.message, { table: "workshop_entries" })
      return { error: "Werkstattaufträge konnten nicht geladen werden" }
    }
    return { data: (data ?? []) as WorkshopEntry[] }
  }) as Promise<{ data?: WorkshopEntry[]; error?: string }>
}

export async function getWorkshopEntry(id: string): Promise<{ data?: WorkshopEntry; error?: string }> {
  return withAuth("fuhrpark", "read", async ({ profile, db }) => {
    const { data, error } = await db
      .from("workshop_entries")
      .select("*")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    if (error || !data) {
      trackError("fleet", "getWorkshopEntry", error?.message ?? "not found", { id })
      return { error: "Werkstattauftrag nicht gefunden" }
    }
    return { data: data as WorkshopEntry }
  }) as Promise<{ data?: WorkshopEntry; error?: string }>
}

export async function createWorkshopEntry(
  formData: FormData
): Promise<{ success?: boolean; id?: string; error?: string | Record<string, string[]> }> {
  return withAuth("fuhrpark", "write", async ({ user, profile, db }) => {
    const validated = workshopEntrySchema.safeParse(Object.fromEntries(formData))
    if (!validated.success) return { error: validated.error.flatten().fieldErrors }

    const v = validated.data

    // Ownership check on referenced entity (split to keep types strict)
    let entity: { id: string } | null = null
    if (v.entity_type === "vehicle") {
      const { data } = await db
        .from("vehicles")
        .select("id")
        .eq("id", v.entity_id)
        .eq("company_id", profile.company_id)
        .single()
      entity = data
    } else {
      const { data } = await db
        .from("equipment")
        .select("id")
        .eq("id", v.entity_id)
        .eq("company_id", profile.company_id)
        .single()
      entity = data
    }

    if (!entity) return { error: "Fahrzeug oder Maschine nicht gefunden" }

    const { data, error } = await db
      .from("workshop_entries")
      .insert({
        company_id: profile.company_id,
        entity_id: v.entity_id,
        entity_type: v.entity_type,
        status: "received",
        reason: v.reason,
        description: v.description,
        entered_at: v.entered_at,
        expected_completion: v.expected_completion,
        cost_parts: v.cost_parts,
        cost_labor: v.cost_labor,
        cost_external: v.cost_external,
        workshop_name: v.workshop_name,
        notes: v.notes,
        created_by: user.id,
      })
      .select("id")
      .single()

    if (error || !data) {
      trackError("fleet", "createWorkshopEntry", error?.message ?? "insert failed", {
        table: "workshop_entries",
      })
      return { error: "Werkstattauftrag konnte nicht angelegt werden" }
    }

    // Auto-set linked asset to "workshop"
    const now = new Date().toISOString()
    if (v.entity_type === "vehicle") {
      await db
        .from("vehicles")
        .update({ status: "workshop", availability_status: "workshop", updated_at: now })
        .eq("id", v.entity_id)
        .eq("company_id", profile.company_id)
    } else {
      await db
        .from("equipment")
        .update({ status: "workshop", availability_status: "workshop", updated_at: now })
        .eq("id", v.entity_id)
        .eq("company_id", profile.company_id)
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "create",
      entityType: "workshop_entry",
      entityId: data.id,
      title: `Werkstattauftrag angelegt: ${v.reason}`,
    })

    revalidatePath("/fuhrpark")
    revalidatePath("/fuhrpark/werkstatt")
    revalidatePath("/fuhrpark/fahrzeuge")
    revalidatePath("/fuhrpark/maschinen")
    return { success: true, id: data.id }
  }) as Promise<{ success?: boolean; id?: string; error?: string | Record<string, string[]> }>
}

export async function updateWorkshopEntry(
  id: string,
  status: string
): Promise<{ success?: boolean; error?: string }> {
  return withAuth("fuhrpark", "write", async ({ user, profile, db }) => {
    if (!["received", "in_repair", "done", "picked_up"].includes(status)) {
      return { error: "Ungültiger Status" }
    }

    // Fetch entry + verify ownership
    const { data: entry, error: fetchError } = await db
      .from("workshop_entries")
      .select("entity_id, entity_type")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single()

    if (fetchError || !entry) {
      trackError("fleet", "updateWorkshopEntry.fetch", fetchError?.message ?? "not found", { id })
      return { error: "Werkstattauftrag nicht gefunden" }
    }

    const updatePayload: Database["public"]["Tables"]["workshop_entries"]["Update"] = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (status === "done" || status === "picked_up") {
      updatePayload.completed_at = new Date().toISOString().split("T")[0]
    }

    const { error } = await db
      .from("workshop_entries")
      .update(updatePayload)
      .eq("id", id)
      .eq("company_id", profile.company_id)

    if (error) {
      trackError("fleet", "updateWorkshopEntry", error.message, { id })
      return { error: "Status konnte nicht aktualisiert werden" }
    }

    // When picked_up, restore linked asset
    if (status === "picked_up") {
      const now = new Date().toISOString()
      if (entry.entity_type === "vehicle") {
        await db
          .from("vehicles")
          .update({ status: "available", availability_status: "available", updated_at: now })
          .eq("id", entry.entity_id)
          .eq("company_id", profile.company_id)
      } else {
        await db
          .from("equipment")
          .update({ status: "available", availability_status: "available", updated_at: now })
          .eq("id", entry.entity_id)
          .eq("company_id", profile.company_id)
      }
    }

    await logActivity({
      companyId: profile.company_id,
      userId: user.id,
      action: "update",
      entityType: "workshop_entry",
      entityId: id,
      title: `Werkstattstatus aktualisiert: ${status}`,
    })

    revalidatePath("/fuhrpark")
    revalidatePath("/fuhrpark/werkstatt")
    revalidatePath("/fuhrpark/fahrzeuge")
    revalidatePath("/fuhrpark/maschinen")
    return { success: true }
  }) as Promise<{ success?: boolean; error?: string }>
}

export async function markWorkshopCompleted(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  return updateWorkshopEntry(id, "done")
}

// ─── Fleet Stats + TÜV ────────────────────────────────────────

export async function getFleetStats(): Promise<FleetStats> {
  const emptyStats: FleetStats = {
    totalVehicles: 0,
    availableVehicles: 0,
    workshopVehicles: 0,
    totalEquipment: 0,
    availableEquipment: 0,
    activeWorkshop: 0,
    tuevWarnings: 0,
    maintenanceWarnings: 0,
  }

  const result = await withAuth("fuhrpark", "read", async ({ profile, db }) => {
    const today = new Date().toISOString().split("T")[0]
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]

    const [vehiclesRes, equipmentRes, workshopRes] = await Promise.all([
      db
        .from("vehicles")
        .select("availability_status, next_inspection")
        .eq("company_id", profile.company_id)
        .is("deleted_at", null),
      db
        .from("equipment")
        .select("availability_status, next_maintenance")
        .eq("company_id", profile.company_id)
        .is("deleted_at", null),
      db
        .from("workshop_entries")
        .select("status")
        .eq("company_id", profile.company_id)
        .in("status", ["received", "in_repair"]),
    ])

    const vehicles = vehiclesRes.data ?? []
    const equipment = equipmentRes.data ?? []
    const workshop = workshopRes.data ?? []

    const tuevWarnings = vehicles.filter(
      (v) => v.next_inspection && v.next_inspection >= today && v.next_inspection <= thirtyDaysFromNow
    ).length

    const maintenanceWarnings = equipment.filter(
      (e) =>
        e.next_maintenance &&
        e.next_maintenance >= today &&
        e.next_maintenance <= thirtyDaysFromNow
    ).length

    return {
      totalVehicles: vehicles.length,
      availableVehicles: vehicles.filter((v) => v.availability_status === "available").length,
      workshopVehicles: vehicles.filter((v) => v.availability_status === "workshop").length,
      totalEquipment: equipment.length,
      availableEquipment: equipment.filter((e) => e.availability_status === "available").length,
      activeWorkshop: workshop.length,
      tuevWarnings,
      maintenanceWarnings,
    }
  })

  if ("error" in result) return emptyStats
  return result
}

/**
 * Vehicles with TÜV due within the next `days` days.
 * Used by Dashboard TÜV warning widgets and cross-module getTuvWarnings.
 */
export async function getVehiclesWithUpcomingTuv(
  days: number = 30
): Promise<{ data?: Vehicle[]; error?: string }> {
  return withAuth("fuhrpark", "read", async ({ profile, db }) => {
    const today = new Date().toISOString().split("T")[0]
    const horizon = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]

    const { data, error } = await db
      .from("vehicles")
      .select("*")
      .eq("company_id", profile.company_id)
      .is("deleted_at", null)
      .not("next_inspection", "is", null)
      .lte("next_inspection", horizon)
      .order("next_inspection", { ascending: true })

    if (error) {
      trackError("fleet", "getVehiclesWithUpcomingTuv", error.message, { table: "vehicles" })
      return { error: "TÜV-Warnungen konnten nicht geladen werden" }
    }

    // Include overdue AND upcoming within horizon
    void today
    const vehicles = (data ?? []).filter((v) => v.next_inspection && v.next_inspection <= horizon)
    return { data: vehicles as Vehicle[] }
  }) as Promise<{ data?: Vehicle[]; error?: string }>
}
