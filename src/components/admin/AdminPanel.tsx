"use client";

import { useState } from "react";
import { ProductForm } from "./ProductForm";
import { ProductTable } from "./ProductTable";

type Category = { id: string; name: string; slug: string };
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

export function AdminPanel({
  products,
  categories,
  adminId,
}: {
  products: Product[];
  categories: Category[];
  adminId: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingProduct(null);
  }

  return (
    <div>
      {/* 操作栏 */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">共 {products.length} 件商品</p>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            添加商品
          </button>
        )}
      </div>

      {/* 表单 */}
      {showForm && (
        <div className="mb-8 rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              {editingProduct ? "编辑商品" : "添加商品"}
            </h2>
            <button
              onClick={handleCloseForm}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              取消
            </button>
          </div>
          <ProductForm
            categories={categories}
            product={editingProduct}
            onSuccess={handleCloseForm}
          />
        </div>
      )}

      {/* 商品表格 */}
      <ProductTable products={products} onEdit={handleEdit} />
    </div>
  );
}
