"use client";

import { useState, useRef } from "react";
import { createProduct, updateProduct } from "@/app/actions/admin";

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
  created_at: string;
};

export function ProductForm({
  categories,
  product,
  onSuccess,
}: {
  categories: Category[];
  product: Product | null;
  onSuccess: () => void;
}) {
  const isEdit = !!product;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    product?.image_url || null
  );
  const [hasNewFile, setHasNewFile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setHasNewFile(true);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    // 客户端验证
    const name = formData.get("name") as string;
    const category_id = formData.get("category_id") as string;
    const price = formData.get("price") as string;
    const stock = formData.get("stock") as string;

    if (!name.trim()) {
      setError("请输入商品名称");
      setLoading(false);
      return;
    }
    if (!category_id) {
      setError("请选择分类");
      setLoading(false);
      return;
    }
    if (!price || parseFloat(price) < 0) {
      setError("请输入有效价格");
      setLoading(false);
      return;
    }
    if (!stock || parseInt(stock, 10) < 0) {
      setError("请输入有效库存");
      setLoading(false);
      return;
    }

    const result = isEdit
      ? await updateProduct(formData)
      : await createProduct(formData);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.message);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isEdit && <input type="hidden" name="id" value={product.id} />}

      {/* 名称 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          商品名称 <span className="text-red-400">*</span>
        </label>
        <input
          name="name"
          defaultValue={product?.name || ""}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-[16px] md:text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="例：高黄豹纹守宫"
        />
      </div>

      {/* 分类 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          分类 <span className="text-red-400">*</span>
        </label>
        <select
          name="category_id"
          defaultValue={product?.category_id || ""}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="" disabled>
            请选择分类
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* 描述 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          描述
        </label>
        <textarea
          name="description"
          rows={4}
          defaultValue={product?.description || ""}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="商品详细描述..."
        />
      </div>

      {/* 价格 + 库存 */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            价格 (¥) <span className="text-red-400">*</span>
          </label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.price || ""}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            库存 <span className="text-red-400">*</span>
          </label>
          <input
            name="stock"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.stock ?? ""}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="0"
          />
        </div>
      </div>

      {/* 状态 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          状态
        </label>
        <select
          name="status"
          defaultValue={product?.status || "active"}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="active">上架</option>
          <option value="inactive">下架</option>
        </select>
      </div>

      {/* 图片 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          商品图片
        </label>
        <input
          ref={fileRef}
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleFileChange}
          className="w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
        />
        <p className="mt-1 text-xs text-gray-400">
          支持 JPG/PNG/WebP/AVIF，最大 5MB
        </p>
        {isEdit && !hasNewFile && (
          <input
            type="hidden"
            name="keep_existing_image"
            value="true"
          />
        )}
        {previewUrl && (
          <div className="mt-3">
            <img
              src={previewUrl}
              alt="预览"
              className="h-32 w-32 rounded-lg border object-cover"
            />
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 提交 */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 py-3 md:py-2.5 text-[15px] md:text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]"
      >
        {loading ? "保存中..." : isEdit ? "保存修改" : "添加商品"}
      </button>
    </form>
  );
}
