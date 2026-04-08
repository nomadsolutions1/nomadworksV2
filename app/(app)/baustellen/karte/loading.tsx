import { Skeleton } from "@/components/ui/skeleton"

export default function KarteLoading() {
  return (
    <div className="flex flex-col h-full space-y-4">
      <Skeleton className="h-4 w-48 rounded" />
      <Skeleton className="h-8 w-64 rounded" />
      <div className="flex-1 min-h-[500px]">
        <Skeleton className="h-full w-full rounded-2xl" />
      </div>
    </div>
  )
}
