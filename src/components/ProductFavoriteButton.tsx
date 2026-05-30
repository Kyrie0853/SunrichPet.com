"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProductFavoriteButton({ productId, initialFavorited, userId, size = "md" }: {
  productId: string;
  initialFavorited: boolean;
  userId?: string | null;
  size?: "sm" | "md";
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) { router.push("/auth"); return; }
    setLoading(true);
    if (favorited) {
      await supabase.from("product_favorites").delete().eq("user_id", userId).eq("product_id", productId);
      setFavorited(false);
    } else {
      const { error } = await supabase.from("product_favorites").insert({ user_id: userId, product_id: productId });
      if (!error) setFavorited(true);
    }
    setLoading(false);
  }

  const iconSize = size === "sm" ? "w-5 h-5" : "w-6 h-6";

  return (
    <button onClick={toggle} disabled={loading}
      className={`rounded-full p-1.5 transition ${favorited ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-400"}`}
      title={favorited ? "取消收藏" : "收藏"}>
      <svg className={iconSize} viewBox="0 0 24 24" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>
  );
}
