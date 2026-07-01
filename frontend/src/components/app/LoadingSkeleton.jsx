import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton({ rows = 3 }) {
  return (
    <div className="max-w-6xl mx-auto space-y-6" data-testid="page-skeleton">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <Skeleton className="h-12 w-96 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl mt-6" />
    </div>
  );
}

export function CardSkeleton() {
  return <Skeleton className="h-40 rounded-2xl" />;
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}
