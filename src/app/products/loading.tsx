export default function ProductsLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8">
        <div className="mb-2 h-8 w-40 animate-pulse rounded bg-gray-200" />
        <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-gray-100 bg-white">
            <div className="aspect-square animate-pulse bg-gray-200" />
            <div className="p-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-5 w-1/2 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
