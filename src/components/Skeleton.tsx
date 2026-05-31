export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded skeleton" />
          <div className="h-4 w-full rounded skeleton" />
          <div className="h-4 w-2/3 rounded skeleton" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-3 w-16 rounded skeleton" />
        <div className="h-3 w-12 rounded skeleton" />
        <div className="h-3 w-12 rounded skeleton ml-auto" />
        <div className="h-3 w-12 rounded skeleton" />
      </div>
    </div>
  );
}

export function SkeletonProductGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-100 bg-white animate-pulse">
          <div className="aspect-square skeleton" />
          <div className="p-3 space-y-2">
            <div className="h-4 w-3/4 rounded skeleton" />
            <div className="h-4 w-1/2 rounded skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonLine({ width = "w-full" }: { width?: string }) {
  return <div className={`h-4 ${width} rounded skeleton`} />;
}
