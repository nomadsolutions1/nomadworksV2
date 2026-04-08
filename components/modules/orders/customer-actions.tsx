"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { deleteCustomer } from "@/lib/actions/customers"
import { MoreHorizontal, Trash2 } from "lucide-react"

interface CustomerActionsProps {
  customerId: string
}

export function CustomerActions({ customerId }: CustomerActionsProps) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCustomer(customerId)
      if (result.error) { toast.error("Fehler beim Loeschen des Kunden"); return }
      toast.success("Kunde wurde geloescht")
      router.refresh()
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Aktionen" />}><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl">
          <DropdownMenuItem className="text-danger gap-2 cursor-pointer" onClick={() => setShowDelete(true)}><Trash2 className="h-4 w-4" /> Loeschen</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="rounded-2xl"><AlertDialogHeader><AlertDialogTitle>Kunden loeschen?</AlertDialogTitle><AlertDialogDescription>Dieser Kunde wird unwiderruflich geloescht. Bestehende Auftraege bleiben erhalten.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="rounded-xl">Abbrechen</AlertDialogCancel><AlertDialogAction onClick={handleDelete} disabled={isPending} variant="destructive" className="rounded-xl font-semibold">Loeschen</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
