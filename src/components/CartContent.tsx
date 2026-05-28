"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateCartItem, removeCartItem, checkout } from "@/app/actions/cart";

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    image_url: string | null;
    stock: number;
    status: string;
  };
};

export function CartContent({ items: initialItems }: { items: CartItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [optimisticItems, setOptimisticItems] = useState(initialItems);

  const total = optimisticItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  async function handleUpdateQuantity(itemId: string, newQty: number) {
    if (newQty <= 0) {
      await handleRemove(itemId);
      return;
    }
    setMessage(null);
    // 乐观更新
    setOptimisticItems((prev) =>
      prev.map((it) =>
        it.id === itemId ? { ...it, quantity: newQty } : it
      )
    );
    const result = await updateCartItem(itemId, newQty);
    if (!result.success) {
      setMessage({ type: "error", text: result.message });
    }
  }

  async function handleRemove(itemId: string) {
    setMessage(null);
    setOptimisticItems((prev) => prev.filter((it) => it.id !== itemId));
    const result = await removeCartItem(itemId);
    if (!result.success) {
      setMessage({ type: "error", text: result.message });
    }
  }

  async function handleCheckout() {
    setMessage(null);
    startTransition(async () => {
      const result = await checkout();
      if (result.success) {
        setOptimisticItems([]);
        setOrderId(result.orderId!);
        setMessage({ type: "success", text: result.message });
      } else {
        setMessage({ type: "error", text: result.message });
      }
    });
  }

  if (orderId) {
    return (
      <div className="rounded-xl bg-emerald-50 p-8 text-center">
        <p className="text-4xl">&#10003;</p>
        <h2 className="mt-4 text-xl font-semibold text-emerald-800">
          下单成功
        </h2>
        <p className="mt-2 text-emerald-600">
          订单编号：{orderId.slice(0, 8)}...
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/orders"
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            查看订单
          </Link>
          <Link
            href="/products"
            className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            继续购物
          </Link>
        </div>
      </div>
    );
  }

  if (optimisticItems.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-gray-400">购物车是空的</p>
        <Link
          href="/products"
          className="mt-4 inline-block text-emerald-600 hover:underline"
        >
          去逛逛
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* 表头 */}
      <div className="hidden border-b pb-3 text-sm font-medium text-gray-500 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_40px]">
        <span>商品</span>
        <span className="text-center">单价</span>
        <span className="text-center">数量</span>
        <span className="text-right">小计</span>
        <span />
      </div>

      {/* 商品列表 */}
      <ul className="divide-y">
        {optimisticItems.map((item) => (
          <li
            key={item.id}
            className="grid items-center gap-2 py-4 sm:grid-cols-[2fr_1fr_1fr_1fr_40px]"
          >
            {/* 商品信息 */}
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {item.product.image_url ? (
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xl text-gray-300">
                    {item.product.name.charAt(0)}
                  </div>
                )}
              </div>
              <Link
                href={`/products/${item.product.slug}`}
                className="text-sm font-medium text-gray-800 hover:text-emerald-600"
              >
                {item.product.name}
              </Link>
            </div>

            {/* 单价 */}
            <span className="text-center text-sm text-gray-600">
              ¥{item.product.price}
            </span>

            {/* 数量 */}
            <div className="flex items-center justify-center">
              <button
                onClick={() =>
                  handleUpdateQuantity(item.id, item.quantity - 1)
                }
                className="flex h-8 w-8 items-center justify-center rounded-l border text-gray-500 hover:bg-gray-50"
              >
                -
              </button>
              <span className="flex h-8 min-w-[2.5rem] items-center justify-center border-y text-sm text-gray-700">
                {item.quantity}
              </span>
              <button
                onClick={() =>
                  handleUpdateQuantity(item.id, item.quantity + 1)
                }
                disabled={item.quantity >= item.product.stock}
                className="flex h-8 w-8 items-center justify-center rounded-r border text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                +
              </button>
            </div>

            {/* 小计 */}
            <span className="text-right text-sm font-semibold text-gray-800">
              ¥{(item.product.price * item.quantity).toFixed(2)}
            </span>

            {/* 删除 */}
            <button
              onClick={() => handleRemove(item.id)}
              className="flex justify-end text-gray-300 hover:text-red-500"
              title="删除"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      {/* 结算栏 */}
      <div className="mt-6 flex flex-col items-end gap-4 border-t pt-6">
        {message && (
          <p
            className={`w-full rounded-lg p-3 text-center text-sm ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}
        <div className="text-right">
          <span className="text-sm text-gray-500">合计 </span>
          <span className="text-2xl font-bold text-emerald-600">
            ¥{total.toFixed(2)}
          </span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={isPending}
          className="rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "处理中..." : "模拟下单"}
        </button>
      </div>
    </div>
  );
}
