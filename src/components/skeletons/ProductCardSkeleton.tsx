export default function ProductCardSkeleton() {
  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border shadow-card animate-pulse">
      {/* Image Skeleton */}
      <div className="relative aspect-square bg-muted/50" />

      <div className="p-4">
        {/* Title Skeleton */}
        <div className="h-4 bg-muted rounded mb-3 w-3/4" />
        <div className="h-4 bg-muted rounded mb-4 w-1/2" />

        {/* Price + Cart Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-5 bg-muted rounded w-20" />
          <div className="h-8 w-8 bg-muted rounded-lg" />
        </div>
      </div>
    </div>
  );
}
