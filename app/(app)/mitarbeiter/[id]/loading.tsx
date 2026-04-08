import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function MitarbeiterDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-48 rounded" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
      </div>
      <Skeleton className="h-10 w-96 rounded-xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader><Skeleton className="h-5 w-24 rounded" /></CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full rounded" />
            ))}
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader><Skeleton className="h-5 w-32 rounded" /></CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-xl" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
