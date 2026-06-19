"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("studio_products").select("*").eq("id", id).single();
      if (data) {
        setForm({
          ...data,
          birth_date: data.birth_date || "",
          estimated_ship_date: data.estimated_ship_date || "",
          personality_tags: (data.personality_tags || []).join(", "),
          images: (data.images || []).join(String.fromCharCode(10)),
          price: String(data.price),
        });
      }
      setPageLoading(false);
    }
    load();
  }, [id, supabase]);

  function update(field: string, value: string) { setForm((prev: any) => ({ ...prev, [field]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/studio/products/" + id, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: form.product_id, name: form.name, species: form.species,
          morph: form.morph || null, birth_date: form.birth_date || null,
          current_weight: form.current_weight || null,
          personality_tags: form.personality_tags ? form.personality_tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
          estimated_ship_date: form.estimated_ship_date || null,
          price: parseFloat(form.price), status: form.status,
          images: form.images ? form.images.split(String.fromCharCode(10)).map((u: string) => u.trim()).filter(Boolean) : [],
          video_url: form.video_url || null, description: form.description,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "保存失败"); setLoading(false); return; }
      router.push("/studio/dashboard/products"); router.refresh();
    } catch { setError("网络错误"); setLoading(false); }
  }

  if (pageLoading) return <div className="py-20 text-center text-[#9ca3af]">加载中...</div>;

  const fields = [
    { label: "编号 *", field: "product_id", placeholder: "如 G2024001" },
    { label: "名称 *", field: "name", placeholder: "如 豹纹守宫" },
    { label: "物种 *", field: "species", placeholder: "如 豹纹守宫" },
    { label: "基因品系", field: "morph", placeholder: "如 白化" },
  ];

  return (
    <div>
      <h1 className="text-lg md:text-xl font-semibold text-[#1f2937] mb-6">编辑个体</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-xl border border-[#f3f4f6] p-6 space-y-4">
        {error && <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-600">{error}</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(fld => (
            <div key={fld.field}>
              <label className="block text-[13px] font-medium text-[#4b5563] mb-1">{fld.label}</label>
              <input value={form[fld.field] || ""} onChange={e => update(fld.field, e.target.value)} placeholder={fld.placeholder} className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
            </div>
          ))}
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">出生日期</label>
            <input type="date" value={form.birth_date || ""} onChange={e => update("birth_date", e.target.value)} className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">当前体重</label>
            <input value={form.current_weight || ""} onChange={e => update("current_weight", e.target.value)} placeholder="如 45g" className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">性格标签</label>
            <input value={form.personality_tags || ""} onChange={e => update("personality_tags", e.target.value)} placeholder="逗号分隔" className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">预计发货日期</label>
            <input type="date" value={form.estimated_ship_date || ""} onChange={e => update("estimated_ship_date", e.target.value)} className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">价格 *</label>
            <input type="number" step="0.01" value={form.price || ""} onChange={e => update("price", e.target.value)} className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">状态</label>
            <select value={form.status || "presale"} onChange={e => update("status", e.target.value)} className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]">
              <option value="presale">预售中</option><option value="available">可发货</option><option value="sold">已售出</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[13px] font-medium text-[#4b5563] mb-1">图片URL（每行一个）</label>
          <textarea value={form.images || ""} onChange={e => update("images", e.target.value)} rows={4} className="w-full rounded-lg border px-3 py-2 text-[16px] outline-none focus:border-[#1a7f5a] resize-none" />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-[#4b5563] mb-1">视频URL（选填）</label>
          <input value={form.video_url || ""} onChange={e => update("video_url", e.target.value)} className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-[#4b5563] mb-1">详细描述</label>
          <textarea value={form.description || ""} onChange={e => update("description", e.target.value)} rows={5} className="w-full rounded-lg border px-3 py-2 text-[16px] outline-none focus:border-[#1a7f5a] resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 rounded-full border py-3 text-[14px] text-[#6b7280] hover:bg-[#f9fafb] min-h-[48px]">取消</button>
          <button type="submit" disabled={loading} className="flex-1 rounded-full bg-[#1a7f5a] py-3 text-[14px] font-semibold text-white hover:bg-[#166b4b] disabled:opacity-50 min-h-[48px]">{loading ? "保存中..." : "保存修改"}</button>
        </div>
      </form>
    </div>
  );
}
