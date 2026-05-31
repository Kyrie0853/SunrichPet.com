"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*, categories:category_id(name)").order("created_at", { ascending: false }).limit(50);
    setProducts((data || []).map((p: any) => ({ ...p, categoryName: Array.isArray(p.categories) ? p.categories[0]?.name : p.categories?.name })));
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  async function toggleStatus(id: string, current: string) {
    const newStatus = current === "active" ? "inactive" : "active";
    await fetch(`/api/admin/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    loadProducts();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-[#1f2937] mb-6">商品管理</h1>
      <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-[#f3f4f6] bg-[#f9fafb]"><th className="text-left px-4 py-3">商品</th><th className="text-left px-4 py-3">价格</th><th className="text-left px-4 py-3">分类</th><th className="text-left px-4 py-3">状态</th><th className="text-right px-4 py-3">操作</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center py-8 text-[#9ca3af]">加载中...</td></tr>
            : products.map(p => (
              <tr key={p.id} className="border-b border-[#f3f4f6] hover:bg-[#f9fafb]">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">{p.image_url?<img src={p.image_url} className="w-full h-full rounded-lg object-cover" alt="" />:p.name?.[0]}</div><span className="font-medium">{p.name}</span></div></td>
                <td className="px-4 py-3 font-medium text-[#1a7f5a]">¥{p.price}</td>
                <td className="px-4 py-3 text-[#6b7280]">{p.categoryName||"-"}</td>
                <td className="px-4 py-3"><span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${p.status==="active"?"bg-emerald-50 text-emerald-700":"bg-gray-100 text-gray-500"}`}>{p.status==="active"?"上架":"下架"}</span></td>
                <td className="px-4 py-3 text-right"><button onClick={()=>toggleStatus(p.id,p.status)} className={`rounded-full px-3 py-1 text-[11px] ${p.status==="active"?"text-red-500 hover:bg-red-50":"text-emerald-600 hover:bg-emerald-50"}`}>{p.status==="active"?"下架":"上架"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
