"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AddressFieldsProps {
  street?: string | null
  zip?: string | null
  city?: string | null
  country?: string | null
  /** Legacy single address field value (for backward compat display) */
  address?: string | null
  required?: boolean
  prefix?: string
}

export function AddressFields({
  street,
  zip,
  city,
  country,
  address,
  required = false,
  prefix = "",
}: AddressFieldsProps) {
  // If we have structured fields, use them. Otherwise try to parse legacy address.
  const defaultStreet = street || ""
  const defaultZip = zip || ""
  const defaultCity = city || ""
  const defaultCountry = country || "Deutschland"

  const namePrefix = prefix ? `${prefix}_` : ""

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2 space-y-1.5">
        <Label htmlFor={`${namePrefix}street`}>Straße + Hausnummer{required ? " *" : ""}</Label>
        <Input
          id={`${namePrefix}street`}
          name={`${namePrefix}street`}
          defaultValue={defaultStreet}
          placeholder="Musterstrasse 42"
          className="h-11 rounded-xl"
          required={required}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${namePrefix}zip`}>PLZ{required ? " *" : ""}</Label>
        <Input
          id={`${namePrefix}zip`}
          name={`${namePrefix}zip`}
          defaultValue={defaultZip}
          placeholder="47051"
          className="h-11 rounded-xl"
          maxLength={5}
          required={required}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${namePrefix}city`}>Stadt{required ? " *" : ""}</Label>
        <Input
          id={`${namePrefix}city`}
          name={`${namePrefix}city`}
          defaultValue={defaultCity}
          placeholder="Duisburg"
          className="h-11 rounded-xl"
          required={required}
        />
      </div>
      {/* Hidden combined address field for backward compat */}
      <input type="hidden" name={`${namePrefix}address`} value="" />
    </div>
  )
}
