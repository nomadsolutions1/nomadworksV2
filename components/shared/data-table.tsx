"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Settings2 } from "lucide-react"
import { EmptyState } from "./empty-state"
import type { LucideIcon } from "lucide-react"

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  searchKey?: string
  searchPlaceholder?: string
  pageSize?: number
  loading?: boolean
  emptyState?: {
    icon: LucideIcon
    title: string
    description: string
    action?: { label: string; onClick: () => void }
  }
  onRowClick?: (row: T) => void
  selectable?: boolean
  onSelectionChange?: (selectedIds: string[]) => void
  columnToggle?: boolean
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Suchen...",
  pageSize = 10,
  loading = false,
  emptyState,
  onRowClick,
  selectable = false,
  onSelectionChange,
  columnToggle = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set())

  const visibleColumns = columns.filter((c) => !hiddenCols.has(c.key))

  function toggleSelection(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedIds(next)
    onSelectionChange?.(Array.from(next))
  }

  function toggleAll() {
    if (selectedIds.size === paged.length) {
      setSelectedIds(new Set())
      onSelectionChange?.([])
    } else {
      const ids = new Set(paged.map((r) => r.id as string))
      setSelectedIds(ids)
      onSelectionChange?.(Array.from(ids))
    }
  }

  function toggleColumn(key: string) {
    const next = new Set(hiddenCols)
    if (next.has(key)) next.delete(key); else next.add(key)
    setHiddenCols(next)
  }

  const filtered = useMemo(() => {
    if (!searchKey || !search) return data
    return data.filter((item) => {
      const val = item[searchKey]
      return typeof val === "string" && val.toLowerCase().includes(search.toLowerCase())
    })
  }, [data, search, searchKey])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal == null || bVal == null) return 0
      const cmp = String(aVal).localeCompare(String(bVal), "de")
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize)

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (data.length === 0 && emptyState) {
    return <EmptyState {...emptyState} />
  }

  return (
    <div className="space-y-4">
      {(searchKey || columnToggle) && (
        <div className="flex items-center gap-2">
          {searchKey && (
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
                className="h-11 rounded-xl pl-9"
              />
            </div>
          )}
          {columnToggle && (
            <Popover>
              <PopoverTrigger className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 h-11 text-sm font-medium text-foreground hover:bg-muted">
                <Settings2 className="h-4 w-4" />
                Spalten
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                {columns.map((col) => (
                  <label key={col.key} className="flex items-center gap-2 py-1.5 px-2 text-sm rounded-md hover:bg-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!hiddenCols.has(col.key)}
                      onChange={() => toggleColumn(col.key)}
                      className="h-3.5 w-3.5 rounded"
                    />
                    {col.header}
                  </label>
                ))}
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}

      {/* Selection bar */}
      {selectable && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-primary text-primary-foreground rounded-xl px-4 py-2">
          <span className="text-sm font-medium">{selectedIds.size} ausgewaehlt</span>
          <Button size="sm" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 rounded-lg text-xs" onClick={() => { setSelectedIds(new Set()); onSelectionChange?.([]) }}>
            Auswahl aufheben
          </Button>
        </div>
      )}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              {selectable && (
                <TableHead className="w-10">
                  <input type="checkbox" checked={selectedIds.size > 0 && selectedIds.size === paged.length} onChange={toggleAll} className="h-4 w-4 rounded" />
                </TableHead>
              )}
              {visibleColumns.map((col) => (
                <TableHead
                  key={col.key}
                  className={col.sortable ? "cursor-pointer select-none" : ""}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((item, i) => {
              const rowKey = (item.id as string) || String(i)
              return (
                <TableRow
                  key={rowKey}
                  onClick={() => onRowClick?.(item)}
                  className={`even:bg-muted/30 transition-colors duration-150 ${onRowClick ? "cursor-pointer hover:bg-primary/5" : "hover:bg-muted"}`}
                >
                  {selectable && (
                    <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(item.id as string)} onChange={() => toggleSelection(item.id as string)} className="h-4 w-4 rounded" />
                    </TableCell>
                  )}
                  {visibleColumns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render
                        ? col.render(item)
                        : String(item[col.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {sorted.length} {sorted.length === 1 ? "Eintrag" : "Eintraege"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>
              Seite {page + 1} von {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
