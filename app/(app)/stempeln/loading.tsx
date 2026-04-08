import { Skeleton } from "@/components/ui/skeleton"

export default function StempelnLoading() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36 rounded-xl" />
        <Skeleton className="h-4 w-56 rounded-lg" />
      </div>
      <Skeleton className="h-80 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  )
}
