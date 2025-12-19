export default function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background py-12 mt-16 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Skeleton */}
        <div className="mb-8 flex items-center space-x-2">
          <div className="h-4 bg-gray-200 rounded w-12" />
          <span className="text-gray-300">/</span>
          <div className="h-4 bg-gray-200 rounded w-16" />
          <span className="text-gray-300">/</span>
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section Skeleton */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-200 rounded-lg" />

            {/* Trust Badges Skeleton */}
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 bg-gray-200 rounded-lg" />
              <div className="h-20 bg-gray-200 rounded-lg" />
              <div className="h-20 bg-gray-200 rounded-lg" />
            </div>
          </div>

          {/* Product Info Section Skeleton */}
          <div className="space-y-6">
            {/* Title Skeleton */}
            <div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-10 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>

            {/* Price Skeleton */}
            <div className="bg-gray-100 rounded-lg p-6">
              <div className="h-12 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>

            {/* Specs Grid Skeleton */}
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-gray-200 rounded-lg" />
              <div className="h-20 bg-gray-200 rounded-lg" />
              <div className="h-20 bg-gray-200 rounded-lg" />
              <div className="h-20 bg-gray-200 rounded-lg" />
            </div>

            {/* Quantity Skeleton */}
            <div className="h-24 bg-gray-200 rounded-lg" />

            {/* Buttons Skeleton */}
            <div className="space-y-3">
              <div className="h-14 bg-gray-200 rounded-lg" />
              <div className="h-14 bg-gray-200 rounded-lg" />
            </div>

            {/* Security Notice Skeleton */}
            <div className="h-20 bg-gray-200 rounded-lg" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="mt-16">
          <div className="flex gap-8 border-b border-gray-200 mb-8">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
            <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
            <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
          </div>
          <div className="bg-gray-100 rounded-lg p-8 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
        </div>
      </div>
    </div>
  );
}
