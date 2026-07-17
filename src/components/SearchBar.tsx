"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function SearchBar({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push("/search?q=" + encodeURIComponent(q));
  }

  return (
    <form onSubmit={handleSubmit} className={className || ""}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜索爬宠个体..."
          maxLength={100}
          className="w-full h-9 rounded-full border border-[#e5e7eb] bg-[#f3f4f6] py-2 pl-4 pr-10 text-[13px] outline-none transition-all duration-200 focus:border-[#1a7f5a] focus:bg-white focus:ring-1 focus:ring-[#1a7f5a]/15 placeholder:text-[#9ca3af]"
        />
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#9ca3af] hover:text-[#1a7f5a] transition-colors duration-200">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </form>
  );
}

