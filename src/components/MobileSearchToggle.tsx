"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function MobileSearchToggle() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push("/search?q=" + encodeURIComponent(q));
    setOpen(false);
    setQuery("");
  }

  function handleToggle() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  return (
    <>
      {/* 搜索图标 - 仅移动端 */}
      <button
        onClick={handleToggle}
        className="md:hidden rounded-full p-2 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937] transition-colors duration-200"
        aria-label="搜索"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* 搜索覆盖层 - 移动端展开 */}
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/30 md:hidden" onClick={() => setOpen(false)}>
          <div
            className="absolute top-0 left-0 right-0 bg-white shadow-lg px-4 py-3"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <button type="button" onClick={() => setOpen(false)} className="p-1 text-[#9ca3af] shrink-0">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索商品..."
                maxLength={100}
                className="flex-1 h-10 rounded-full border border-[#e5e7eb] bg-[#f3f4f6] px-4 text-[16px] outline-none focus:border-[#1a7f5a] focus:bg-white"
              />
              <button type="submit" className="shrink-0 rounded-full bg-[#1a7f5a] px-4 py-2 text-[13px] font-medium text-white">
                搜索
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
