"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = { presale: "预售中", available: "可发货", sold: "已售出" };
const STATUS_COLORS: Record<string, string> = { presale: "bg-orange-50 text-orange-600", available: "bg-emerald-50 text-emerald-600", sold: "bg-gray-100 text-gray-400" };

export default function StudioProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("studio_products").select("*").order("created_at", { ascending: false }).limit(50);
    setProducts(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(id: string, newStatus: string) {
    await fetch("/api/studio/products/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    load();
  }

  async function deleteProduct(id: string) {
    if (!confirm("确定删除该个体？")) return;
    await fetch("/api/studio/products/" + id, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg md:text-xl font-semibold text-[#1f2937]">个体管理</h1>
        <Link href="/studio/dashboard/products/new" className="rounded-full bg-[#1a7f5a] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#166b4b] min-h-[44px] flex items-center">+ 添加新个体</Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] overflow-hidden">
        {loading ? (
          <p className="py-12 text-center text-[#9ca3af]">加载中...</p>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🦎</p>
            <p className="text-[#9ca3af] text-[14px] mb-4">暂无个体</p>
            <Link href="/studio/dashboard/products/new" className="inline-block rounded-full bg-[#1a7f5a] px-5 py-2 text-[13px] font-medium text-white">添加第一个个体</Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="w-full text-[13px]">
              <thead><tr className="border-b border-[#f3f4f6] bg-[#f9fafb]"><th className="text-left px-3 md:px-4 py-3">编号</th><th className="text-left px-3 md:px-4 py-3">名称</th><th className="text-left px-3 md:px-4 py-3 hidden sm:table-cell">物种</th><th className="text-left px-3 md:px-4 py-3">价格</th><th className="text-left px-3 md:px-4 py-3">状态</th><th className="text-right px-3 md:px-4 py-3">操作</th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-[#f3f4f6] hover:bg-[#f9fafb]">
                    <td className="px-3 md:px-4 py-3 font-mono text-[11px]">{p.product_id}</td>
                    <td className="px-3 md:px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" alt="" /> : <div className="flex h-full items-center justify-center text-xs text-gray-400">🦎</div>}
                        </div>
                        <span className="font-medium line-clamp-1">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3 text-[#6b7280] hidden sm:table-cell">{p.species}</td>
                    <td className="px-3 md:px-4 py-3 font-medium text-[#1a7f5a]">¥{p.price}</td>
                    <td className="px-3 md:px-4 py-3">
                      <select value={p.status} onChange={e => changeStatus(p.id, e.target.value)} className={"rounded-full px-2 py-1 text-[11px] font-medium border outline-none " + (STATUS_COLORS[p.status] || "")}>
                        <option value="presale">预售中</option>
                        <option value="available">可发货</option>
                        <option value="sold">已售出</option>
                      </select>
                    </td>
                    <td className="px-3 md:px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={"/studio/dashboard/products/" + p.id + "/edit"} className="rounded-lg px-2 py-1.5 text-[11px] text-[#1a7f5a] hover:bg-[#e8f5ef] min-w-[44px] min-h-[44px] flex items-center justify-center">编辑</Link>
                        <button onClick={() => deleteProduct(p.id)} className="rounded-lg px-2 py-1.5 text-[11px] text-red-500 hover:bg-red-50 min-w-[44px] min-h-[44px]">删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
