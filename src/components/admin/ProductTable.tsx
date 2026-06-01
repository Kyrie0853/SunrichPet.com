"use client";

import { useState } from "react";
import { deleteProduct } from "@/app/actions/admin";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  image_url: string | null;
  status: string;
  category_id: string;
  category: { name: string } | null;
  created_at: string;
};

export function ProductTable({
  products,
  onEdit,
}: {
  products: Product[];
  onEdit: (p: Product) => void;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    const result = await deleteProduct(id);
    if (!result.success) {
      alert(result.message);
    }
    setDeleting(null);
    setConfirmDelete(null);
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border bg-white py-16 text-center text-gray-400">
        暂无商品，点击上方按钮添加
      </div>
    );
  }

  return (
    <div className="table-responsive rounded-xl border bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-gray-50">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-500">商品</th>
            <th className="hidden px-4 py-3 font-medium text-gray-500 sm:table-cell">
              分类
            </th>
            <th className="px-4 py-3 font-medium text-gray-500">价格</th>
            <th className="hidden px-4 py-3 font-medium text-gray-500 sm:table-cell">
              库存
            </th>
            <th className="hidden px-4 py-3 font-medium text-gray-500 sm:table-cell">
              状态
            </th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-300">
                        {p.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="truncate font-medium text-gray-800 max-w-[140px]">
                    {p.name}
                  </span>
                </div>
              </td>
              <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                {p.category?.name || "-"}
              </td>
              <td className="px-4 py-3 font-medium text-emerald-600">
                ¥{p.price}
              </td>
              <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">
                {p.stock}
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.status === "active"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {p.status === "active" ? "上架" : "下架"}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(p)}
                    className="rounded-md px-2.5 py-1.5 md:py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                  >
                    编辑
                  </button>
                  {confirmDelete === p.id ? (
                    <span className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="rounded-md bg-red-600 px-2 py-1.5 md:py-1 text-xs font-medium text-white hover:bg-red-700 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                      >
                        确认
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded-md px-2 py-1.5 md:py-1 text-xs text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                      >
                        取消
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(p.id)}
                      className="rounded-md px-2.5 py-1.5 md:py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                    >
                      删除
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
