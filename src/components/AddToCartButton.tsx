"use client";

import { useState } from "react";
import { useGuestCart } from "@/hooks/useGuestCart";

export default function AddToCartButton({
  productId,
  name,
  price,
  image,
}: {
  productId: string;
  name: string;
  price: number;
  image: string;
}) {
  const { addItem, totalCount } = useGuestCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({
      product_id: productId,
      name,
      price: typeof price === "number" ? price : Number(price) || 0,
      image: image || "",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      onClick={handleAdd}
      className={`w-full rounded-xl py-4 text-center text-[15px] font-bold transition-all active:scale-[0.98] min-h-[48px] flex items-center justify-center gap-2 ${
        added
          ? "bg-[#166b4b] text-white"
          : "border-2 border-[#1a7f5a] text-[#1a7f5a] hover:bg-[#e8f5ef]"
      }`}
    >
      {added ? (
        <>✅ 已加入购物车</>
      ) : (
        <>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 003 3h4.5a3 3 0 003-3H7.5zM6.75 14.25l-1.5-6h13.5l-1.5 6H6.75zM9 17.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM19.5 17.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          </svg>
          加入购物车
        </>
      )}
    </button>
  );
}
