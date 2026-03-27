import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}
