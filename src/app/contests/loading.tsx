export default function ContestsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="h-8 w-48 bg-neutral-200 rounded animate-pulse mb-8" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="border border-neutral-200 p-6 animate-pulse">
            <div className="h-3 w-16 bg-neutral-200 rounded mb-3" />
            <div className="h-5 w-40 bg-neutral-100 rounded mb-4" />
            <div className="flex justify-between">
              <div className="h-3 w-20 bg-neutral-100 rounded" />
              <div className="h-3 w-16 bg-neutral-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
