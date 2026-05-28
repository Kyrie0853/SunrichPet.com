export default function ProductDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-2xl bg-gray-200" />
        <div className="flex flex-col">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-4 h-9 w-32 animate-pulse rounded bg-gray-200" />
          <div className="mt-6 h-6 w-24 animate-pulse rounded bg-gray-200" />
          <div className="mt-6 border-t pt-6">
            <div className="mb-3 h-4 w-20 animate-pulse rounded bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
