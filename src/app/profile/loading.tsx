export default function ProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Profile header skeleton */}
      <div className="border border-neutral-200 p-8 mb-8 animate-pulse">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-neutral-200" />
          <div className="space-y-3">
            <div className="h-6 w-32 bg-neutral-200 rounded" />
            <div className="h-4 w-48 bg-neutral-100 rounded" />
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border border-neutral-200 p-6 text-center animate-pulse">
            <div className="h-8 w-12 bg-neutral-200 rounded mx-auto mb-2" />
            <div className="h-3 w-20 bg-neutral-100 rounded mx-auto" />
          </div>
        ))}
      </div>

      {/* Heatmap skeleton */}
      <div className="border border-neutral-200 p-6 h-48 animate-pulse bg-neutral-50 mb-8" />
    </div>
  );
}
