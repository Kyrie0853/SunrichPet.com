"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [topCatId, setTopCatId] = useState("");
  const [form, setForm] = useState({
    product_id: "", name: "", species: "", morph: "",
    birth_date: "", current_weight: "", personality_tags: "",
    estimated_ship_date: "", price: "", status: "presale",
    images: "", video_url: "", description: "", category_id: "",
  });

  useEffect(() => {
    fetch("/api/studio/categories").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setCategories(data);
    }).catch(() => {});
  }, []);

  function update(field: string, value: string) { setForm(prev => ({ ...prev, [field]: value })); }

  const topCategories = categories.filter((c: any) => !c.parent_id);
  const subCategories = categories.filter((c: any) => c.parent_id === topCatId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.product_id || !form.name || !form.species || !form.price) {
      setError("请填写编号、名称、物种和价格"); return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/studio/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: form.product_id, name: form.name, species: form.species,
          morph: form.morph || null, birth_date: form.birth_date || null,
          current_weight: form.current_weight || null,
          personality_tags: form.personality_tags ? form.personality_tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
          estimated_ship_date: form.estimated_ship_date || null,
          price: parseFloat(form.price), status: form.status,
          images: form.images ? form.images.split(String.fromCharCode(10)).map((u: string) => u.trim()).filter(Boolean) : [],
          video_url: form.video_url || null, description: form.description,
          category_id: form.category_id || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "创建失败"); setLoading(false); return; }
      router.push("/studio/dashboard/products"); router.refresh();
    } catch { setError("网络错误"); setLoading(false); }
  }

  const textFields = [
    { label: "编号 *", field: "product_id", placeholder: "如 G2024001" },
    { label: "名称 *", field: "name", placeholder: "如 豹纹守宫 - 阳光" },
    { label: "物种 *", field: "species", placeholder: "如 豹纹守宫" },
    { label: "基因品系", field: "morph", placeholder: "如 白化" },
  ];

  return (
    <div>
      <h1 className="text-lg md:text-xl font-semibold text-[#1f2937] mb-6">添加新个体</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-xl border border-[#f3f4f6] p-6 space-y-4">
        {error && <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-600">{error}</div>}

        {/* 分类选择器 */}
        {categories.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 p-3 bg-[#e8f5ef] rounded-lg">
            <div>
              <label className="block text-[13px] font-medium text-[#4b5563] mb-1">顶级分类</label>
              <select value={topCatId} onChange={e => { setTopCatId(e.target.value); update("category_id", ""); }}
                className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]">
                <option value="">选择顶级分类</option>
                {topCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#4b5563] mb-1">二级分类</label>
              <select value={form.category_id} onChange={e => update("category_id", e.target.value)}
                className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" disabled={!topCatId}>
                <option value="">选择二级分类</option>
                {subCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {textFields.map(fld => (
            <div key={fld.field}>
              <label className="block text-[13px] font-medium text-[#4b5563] mb-1">{fld.label}</label>
              <input value={(form as any)[fld.field]} onChange={e => update(fld.field, e.target.value)}
                placeholder={fld.placeholder} className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
            </div>
          ))}
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">出生日期</label>
            <input type="date" value={form.birth_date} onChange={e => update("birth_date", e.target.value)}
              className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">当前体重</label>
            <input value={form.current_weight} onChange={e => update("current_weight", e.target.value)}
              placeholder="如 45g" className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">性格标签</label>
            <input value={form.personality_tags} onChange={e => update("personality_tags", e.target.value)}
              placeholder="逗号分隔，如 活泼,不怕人" className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">预计发货日期</label>
            <input type="date" value={form.estimated_ship_date} onChange={e => update("estimated_ship_date", e.target.value)}
              className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">价格 *</label>
            <input type="number" step="0.01" value={form.price} onChange={e => update("price", e.target.value)}
              placeholder="如 1500" className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">状态</label>
            <select value={form.status} onChange={e => update("status", e.target.value)}
              className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]">
              <option value="presale">预售中</option>
              <option value="available">可发货</option>
              <option value="sold">已售出</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[13px] font-medium text-[#4b5563] mb-1">图片URL（每行一个）</label>
          <textarea value={form.images} onChange={e => update("images", e.target.value)} rows={4}
            placeholder="https://example.com/img1.jpg
https://example.com/img2.jpg"
            className="w-full rounded-lg border px-3 py-2 text-[16px] outline-none focus:border-[#1a7f5a] resize-none" />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-[#4b5563] mb-1">视频URL（选填）</label>
          <input value={form.video_url} onChange={e => update("video_url", e.target.value)}
            placeholder="https://example.com/video.mp4" className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-[#4b5563] mb-1">详细描述</label>
          <textarea value={form.description} onChange={e => update("description", e.target.value)} rows={5}
            placeholder="描述该个体的特点、饲养建议等..."
            className="w-full rounded-lg border px-3 py-2 text-[16px] outline-none focus:border-[#1a7f5a] resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="flex-1 rounded-full border py-3 text-[14px] text-[#6b7280] hover:bg-[#f9fafb] min-h-[48px]">取消</button>
          <button type="submit" disabled={loading}
            className="flex-1 rounded-full bg-[#1a7f5a] py-3 text-[14px] font-semibold text-white hover:bg-[#166b4b] disabled:opacity-50 min-h-[48px]">
            {loading ? "创建中..." : "发布个体"}
          </button>
        </div>
      </form>
    </div>
  );
}
