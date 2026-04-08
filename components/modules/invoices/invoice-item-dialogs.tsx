"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import type { InvoiceItem } from "@/lib/actions/invoices"

interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isPending: boolean
}

export function AddItemDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: AddItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle>Position hinzufuegen</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="add-description">Beschreibung *</Label>
            <Input
              id="add-description"
              name="description"
              placeholder="z.B. Betonarbeiten Fundament"
              className="h-11 rounded-xl"
              required
            />
          </div>
          <ItemFields prefix="add" />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
              aria-label="Abbrechen"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl font-semibold"
              aria-label="Position hinzufuegen"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Hinzufuegen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditItemDialogProps {
  item: InvoiceItem | null
  onClose: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isPending: boolean
}

export function EditItemDialog({
  item,
  onClose,
  onSubmit,
  isPending,
}: EditItemDialogProps) {
  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle>Position bearbeiten</DialogTitle>
        </DialogHeader>
        {item && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Beschreibung *</Label>
              <Input
                id="edit-description"
                name="description"
                defaultValue={item.description}
                className="h-11 rounded-xl"
                required
              />
            </div>
            <ItemFields prefix="edit" defaults={item} />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={onClose}
                aria-label="Abbrechen"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl font-semibold"
                aria-label="Position speichern"
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Speichern
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface DeleteItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteItemDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteItemDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Position loeschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Diese Position wird unwiderruflich geloescht und der
            Rechnungsbetrag neu berechnet.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-xl font-semibold bg-danger hover:bg-danger/90"
            aria-label="Position endgueltig loeschen"
          >
            Loeschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ItemFields({
  prefix,
  defaults,
}: {
  prefix: string
  defaults?: { quantity: number; unit?: string | null; unit_price: number }
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-quantity`}>Menge *</Label>
        <Input
          id={`${prefix}-quantity`}
          name="quantity"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaults?.quantity}
          placeholder="1"
          className="h-11 rounded-xl"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-unit`}>Einheit</Label>
        <Input
          id={`${prefix}-unit`}
          name="unit"
          defaultValue={defaults?.unit ?? ""}
          placeholder="m2, Std., Stk."
          className="h-11 rounded-xl"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-unit-price`}>EP (EUR) *</Label>
        <Input
          id={`${prefix}-unit-price`}
          name="unit_price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaults?.unit_price}
          placeholder="0.00"
          className="h-11 rounded-xl"
          required
        />
      </div>
    </div>
  )
}
