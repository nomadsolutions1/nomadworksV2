import { Skeleton } from "@/components/ui/skeleton"

export default function AuftragDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-48 rounded" />
      <Skeleton className="h-8 w-64 rounded" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
}
