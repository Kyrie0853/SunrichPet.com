"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addToCart } from "@/app/actions/cart";

export function AddToCartButton({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const router = useRouter();

  async function handleAddToCart() {
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth");
      return;
    }

    const result = await addToCart(productId, 1);
    setMessage({
      type: result.success ? "success" : "error",
      text: result.message,
    });
    setLoading(false);
  }

  if (stock === 0) {
    return (
      <button
        disabled
        className="w-full rounded-xl bg-gray-200 py-3.5 text-sm font-semibold text-gray-400 cursor-not-allowed"
      >
        已售罄
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handleAddToCart}
        disabled={loading}
        className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "处理中..." : "加入购物车"}
      </button>
      {message && (
        <p
          className={`mt-3 text-center text-sm ${
            message.type === "success" ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
