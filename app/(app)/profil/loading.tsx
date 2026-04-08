import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  )
}
