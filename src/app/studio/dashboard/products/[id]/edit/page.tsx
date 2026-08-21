"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ImageUploader from "@/components/admin/ImageUploader";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [topCatId, setTopCatId] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("studio_products").select("*").eq("id", id).single();
      if (data) {
        setForm({
          name: data.name || "",
          species: data.species || "",
          morph: data.morph || "",
          current_weight: data.current_weight || "",
          estimated_ship_date: data.estimated_ship_date || "",
          images: (data.images || []).join("\n"),
          price: String(data.price || ""),
          status: data.status || "presale",
          description: data.description || "",
          category_id: data.category_id || "",
          product_id: data.product_id || "",
        });
        // 反查分类
        if (data.category_id) {
          fetch("/api/studio/categories").then(r => r.json()).then((cats: any[]) => {
            setCategories(cats || []);
            const current = (cats || []).find((c: any) => c.id === data.category_id);
            if (current?.parent_id) setTopCatId(current.parent_id);
          }).catch(() => {});
        }
      }
      setPageLoading(false);
    }
    load();
  }, [id, supabase]);

  useEffect(() => {
    if (categories.length === 0) {
      fetch("/api/studio/categories").then(r => r.json()).then(data => {
        if (Array.isArray(data)) setCategories(data);
      }).catch(() => {});
    }
  }, []);

  function update(field: string, value: string) { setForm((prev: any) => ({ ...prev, [field]: value })); }

  const topCategories = categories.filter((c: any) => !c.parent_id);
  const subCategories = categories.filter((c: any) => c.parent_id === topCatId);

  const handleSubCategoryChange = useCallback((subId: string) => {
    update("category_id", subId);
    const sub = subCategories.find((c: any) => c.id === subId);
    if (sub) update("species", sub.name);
  }, [subCategories]);

  const handleTopCategoryChange = useCallback((topId: string) => {
    setTopCatId(topId);
    // 编辑时不自动清空已有分类，除非顶级分类确实变了
    if (topId && form.category_id) {
      const currentSub = subCategories.find((c: any) => c.id === form.category_id);
      if (!currentSub) update("category_id", "");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.species || !form.price) {
      setError("请填写名称、物种和价格"); return;
    }
    setLoading(true); setError("");
    try {
      const images = form.images ? form.images.split("\n").map((u: string) => u.trim()).filter(Boolean) : [];
      const res = await fetch("/api/studio/products/" + id, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          species: form.species,
          morph: form.morph || null,
          current_weight: form.current_weight || null,
          estimated_ship_date: form.estimated_ship_date || null,
          price: parseFloat(form.price),
          status: form.status,
          images,
          description: form.description?.trim() || "",
          category_id: form.category_id || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "保存失败"); setLoading(false); return; }
      router.push("/studio/dashboard/products"); router.refresh();
    } catch { setError("网络错误"); setLoading(false); }
  }

  if (pageLoading) return <div className="py-20 text-center text-[#9ca3af]">加载中...</div>;

  return (
    <div>
      <h1 className="text-lg md:text-xl font-semibold text-[#1f2937] mb-6">编辑商品</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-xl border border-[#f3f4f6] p-6 space-y-4">
        {error && <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-600">{error}</div>}

        {/* 编号（只读） */}
        <div className="p-3 bg-[#e8f5ef] rounded-lg flex items-center gap-3">
          <span className="text-[13px] text-[#6b7280] shrink-0">商品编号</span>
          <code className="flex-1 text-[15px] font-mono font-bold text-[#1a7f5a]">
            {form.product_id || "—"}
          </code>
        </div>

        {/* 分类选择器 */}
        {categories.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 p-3 bg-[#f9fafb] rounded-lg border border-[#f3f4f6]">
            <div>
              <label className="block text-[13px] font-medium text-[#4b5563] mb-1">分类 *</label>
              <select value={topCatId} onChange={e => handleTopCategoryChange(e.target.value)}
                className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]">
                <option value="">选择顶级分类</option>
                {topCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#4b5563] mb-1">品系 *</label>
              <select value={form.category_id || ""} onChange={e => handleSubCategoryChange(e.target.value)}
                className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" disabled={!topCatId}>
                <option value="">选择具体品系</option>
                {subCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* 物种（只读） */}
        <div>
          <label className="block text-[13px] font-medium text-[#4b5563] mb-1">物种（自动）</label>
          <input value={form.species || ""}
            readOnly
            className="w-full h-11 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 text-[16px] text-[#6b7280] outline-none cursor-default" />
        </div>

        {/* 名称 */}
        <div>
          <label className="block text-[13px] font-medium text-[#4b5563] mb-1">名称/标题 *</label>
          <input value={form.name || ""} onChange={e => update("name", e.target.value)}
            placeholder="如 豹纹守宫 - 阳光"
            className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">基因品系</label>
            <input value={form.morph || ""} onChange={e => update("morph", e.target.value)}
              placeholder="如 白化"
              className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">当前体重</label>
            <input value={form.current_weight || ""} onChange={e => update("current_weight", e.target.value)}
              placeholder="如 45g"
              className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">价格 *</label>
            <input type="number" step="0.01" value={form.price || ""} onChange={e => update("price", e.target.value)}
              placeholder="如 599"
              className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">状态</label>
            <select value={form.status || "presale"} onChange={e => update("status", e.target.value)}
              className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]">
              <option value="presale">预售中</option>
              <option value="available">可发货</option>
              <option value="sold">已售出</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">预计发货（选填）</label>
            <input type="date" value={form.estimated_ship_date || ""} onChange={e => update("estimated_ship_date", e.target.value)}
              className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
        </div>

        {/* 图片上传 */}
        <div>
          <label className="block text-[13px] font-medium text-[#4b5563] mb-1">商品图片</label>
          <ImageUploader
            existingUrls={typeof form.images === "string" ? form.images.split("\n").filter(Boolean) : (form.images || [])}
            onChange={(urls) => update("images", urls.join("\n"))}
          />
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-[13px] font-medium text-[#4b5563] mb-1">详细描述</label>
          <textarea value={form.description || ""} onChange={e => update("description", e.target.value)} rows={4}
            placeholder="描述该个体的特点、饲养建议等..."
            className="w-full rounded-lg border px-3 py-2 text-[16px] outline-none focus:border-[#1a7f5a] resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 rounded-full border py-3 text-[14px] text-[#6b7280] hover:bg-[#f9fafb] min-h-[48px]">取消</button>
          <button type="submit" disabled={loading} className="flex-1 rounded-full bg-[#1a7f5a] py-3 text-[14px] font-semibold text-white hover:bg-[#166b4b] disabled:opacity-50 min-h-[48px]">{loading ? "保存中..." : "保存修改"}</button>
        </div>
      </form>
    </div>
  );
}
