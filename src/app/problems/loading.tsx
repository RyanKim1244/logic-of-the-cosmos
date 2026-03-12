export default function ProblemsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="h-8 w-40 bg-neutral-200 rounded animate-pulse mb-8" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border border-neutral-200 p-5 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-4 w-12 bg-neutral-200 rounded" />
              <div className="h-4 w-64 bg-neutral-100 rounded" />
              <div className="ml-auto h-4 w-20 bg-neutral-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
