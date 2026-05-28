"use client";

import { useState, type FormEvent } from "react";

export function SearchBar() {
  const [query, setQuery] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // 搜索功能稍后实现
    if (query.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(query.trim())}`;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索宠物、用品..."
        className="w-full rounded-full border border-gray-200 bg-white py-3.5 pl-5 pr-14 text-sm shadow-sm outline-none transition-shadow focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-emerald-600 p-2 text-white hover:bg-emerald-700"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
      </button>
    </form>
  );
}
