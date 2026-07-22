"use client";

import { useEffect } from "react";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ShopError Boundary]", {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack?.split("\n").slice(0, 5).join("\n"),
    });
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="text-5xl mb-4">😥</p>
      <h2 className="text-lg font-bold text-red-600 mb-2">页面加载失败</h2>
      <p className="text-[14px] text-gray-500 mb-2">请刷新页面重试</p>
      <div className="mb-4 mx-auto max-w-lg rounded-xl bg-red-50 border border-red-200 p-3 text-left text-[11px] font-mono text-red-700">
        <p className="font-bold">{error.name}: {error.message}</p>
        {error.digest && <p className="text-red-400 mt-1">Digest: {error.digest}</p>}
        {error.stack && (
          <details className="mt-1">
            <summary className="text-red-400 cursor-pointer">Stack</summary>
            <pre className="mt-1 text-red-500 whitespace-pre-wrap text-[10px]">{error.stack}</pre>
          </details>
        )}
      </div>
      <button
        onClick={() => reset()}
        className="rounded-xl bg-[#1a7f5a] px-6 py-3 text-[14px] font-semibold text-white hover:bg-[#166b4b] transition-colors"
      >
        刷新页面
      </button>
    </div>
  );
}
