import { Skeleton } from "@/components/ui/skeleton";

export default function TicketsLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="flex gap-3 mb-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}
