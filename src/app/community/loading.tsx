export default function CommunityLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="h-8 w-36 bg-neutral-200 rounded animate-pulse mb-8" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-neutral-200 p-5 animate-pulse">
            <div className="h-5 w-56 bg-neutral-100 rounded mb-3" />
            <div className="h-3 w-full bg-neutral-50 rounded mb-2" />
            <div className="flex gap-4">
              <div className="h-3 w-20 bg-neutral-100 rounded" />
              <div className="h-3 w-16 bg-neutral-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
