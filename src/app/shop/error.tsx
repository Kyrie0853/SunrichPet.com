'use client';

import { useEffect } from 'react';

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Shop page error:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="text-5xl mb-4">😥</p>
      <h2 className="text-lg font-bold text-red-600 mb-2">商城页面出错</h2>
      <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-left text-[13px] font-mono">
        <p className="text-red-700 font-bold mb-1">{error.name}: {error.message}</p>
        {error.digest && <p className="text-red-400">Digest: {error.digest}</p>}
        {error.stack && (
          <details className="mt-2">
            <summary className="text-red-400 cursor-pointer">Stack Trace</summary>
            <pre className="mt-1 text-[11px] text-red-500 whitespace-pre-wrap">{error.stack}</pre>
          </details>
        )}
      </div>
      <button
        onClick={reset}
        className="rounded-xl bg-[#1a7f5a] px-6 py-3 text-[14px] font-semibold text-white hover:bg-[#166b4b] transition-colors"
      >
        重试
      </button>
    </div>
  );
}
