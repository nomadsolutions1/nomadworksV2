function getEasterDate(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function getGermanHolidays(year: number): Map<string, string> {
  const easter = getEasterDate(year)
  const holidays = new Map<string, string>()

  holidays.set(`${year}-01-01`, "Neujahr")
  holidays.set(toDateString(addDays(easter, -2)), "Karfreitag")
  holidays.set(toDateString(addDays(easter, 1)), "Ostermontag")
  holidays.set(`${year}-05-01`, "Tag der Arbeit")
  holidays.set(toDateString(addDays(easter, 39)), "Christi Himmelfahrt")
  holidays.set(toDateString(addDays(easter, 50)), "Pfingstmontag")
  holidays.set(`${year}-10-03`, "Tag der Deutschen Einheit")
  holidays.set(`${year}-12-25`, "1. Weihnachtstag")
  holidays.set(`${year}-12-26`, "2. Weihnachtstag")

  return holidays
}

export function isHoliday(date: Date): boolean {
  const holidays = getGermanHolidays(date.getFullYear())
  return holidays.has(toDateString(date))
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function isNightShift(hour: number): boolean {
  return hour >= 23 || hour < 6
}

export type SurchargeType = "night" | "weekend" | "holiday" | null

export function getSurchargeType(date: Date): SurchargeType {
  if (isHoliday(date)) return "holiday"
  if (isWeekend(date)) return "weekend"
  if (isNightShift(date.getHours())) return "night"
  return null
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Guten Morgen"
  if (hour < 18) return "Guten Tag"
  return "Guten Abend"
}

export function getWeekDates(date: Date): Date[] {
  const day = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

/**
 * Get ISO-8601 calendar week number for a given date.
 * ISO-8601: Week 1 is the week containing the first Thursday of the year.
 * Weeks start on Monday.
 */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // Set to nearest Thursday: current date + 4 - current day number (Monday=1, Sunday=7)
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return weekNo
}

/**
 * Get the ISO-8601 week year for a given date.
 * The week year may differ from the calendar year at year boundaries.
 */
export function getISOWeekYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  return d.getUTCFullYear()
}

/**
 * Format a date as "KW XX/YYYY" (German calendar week format).
 */
export function formatCalendarWeek(date: Date): string {
  const week = getISOWeekNumber(date)
  const year = getISOWeekYear(date)
  return `KW ${week.toString().padStart(2, "0")}/${year}`
}
