export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="relative h-48 bg-gray-200" />

      <div className="p-4">
        {/* Title Skeleton */}
        <div className="h-6 bg-gray-200 rounded mb-3 w-3/4" />

        {/* Specs Skeleton */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        </div>

        {/* Description Skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
        </div>

        {/* Button Skeleton */}
        <div className="h-12 bg-gray-200 rounded mb-4" />

        {/* Price Section Skeleton */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="h-8 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
}
