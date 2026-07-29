"use client";

import Link from "next/link";
import { useGuestCart } from "@/hooks/useGuestCart";

export default function CartIcon() {
  const { totalCount } = useGuestCart();

  return (
    <Link
      href="/cart"
      prefetch={true}
      className="relative rounded-full p-2 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937] transition-colors duration-200"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 003 3h4.5a3 3 0 003-3H7.5zM6.75 14.25l-1.5-6h13.5l-1.5 6H6.75zM9 17.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM19.5 17.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
      {totalCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#dc3545] px-1 text-[10px] font-bold text-white leading-none">
          {totalCount > 99 ? "99+" : totalCount}
        </span>
      )}
    </Link>
  );
}
