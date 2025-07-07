export default function NeedAnalysisLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="space-y-4">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 pb-4 border-b border-gray-200">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
              {/* Table Rows */}
              {[...Array(8)].map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 py-3">
                  {[...Array(12)].map((_, j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
