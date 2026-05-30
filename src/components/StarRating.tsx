"use client";

export default function StarRating({ rating, onRate, readonly = false, size = "md" }: {
  rating: number;
  onRate?: (r: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-8 h-8" : "w-5 h-5";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= rating;
        const half = !filled && star - 0.5 <= rating;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onRate?.(star)}
            className={`${sizeClass} transition ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
          >
            <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"}
              stroke="currentColor" strokeWidth={1.5}
              className={filled ? "text-amber-400" : half ? "text-amber-300" : "text-gray-300"}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              {half && <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77V2z" fill="currentColor" />}
            </svg>
          </button>
        );
      })}
    </div>
  );
}
