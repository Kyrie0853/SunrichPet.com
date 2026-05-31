"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminSettingsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const loadCategories = useCallback(async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCategories(data || []);
  }, [supabase]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  async function addCategory() {
    if (!newName.trim() || !newSlug.trim()) return;
    setLoading(true);
    await supabase.from("categories").insert({ name: newName.trim(), slug: newSlug.trim().toLowerCase() });
    setNewName(""); setNewSlug("");
    setLoading(false);
    loadCategories();
  }

  async function deleteCategory(id: string) {
    if (!confirm("确定删除该分类?")) return;
    await supabase.from("categories").delete().eq("id", id);
    loadCategories();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-[#1f2937] mb-6">系统设置</h1>

      <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] p-5 mb-6">
        <h2 className="text-[15px] font-semibold text-[#1f2937] mb-4">商品分类管理</h2>
        <div className="flex gap-2 mb-4">
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="分类名称" className="h-9 rounded-lg border border-[#e5e7eb] px-3 text-[13px] outline-none focus:border-[#1a7f5a]" />
          <input value={newSlug} onChange={e=>setNewSlug(e.target.value)} placeholder="slug (英文)" className="h-9 rounded-lg border border-[#e5e7eb] px-3 text-[13px] outline-none focus:border-[#1a7f5a]" />
          <button onClick={addCategory} disabled={loading} className="rounded-full bg-[#1a7f5a] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#166b4b] disabled:opacity-50">添加</button>
        </div>
        <div className="space-y-1">
          {categories.map(c => (
            <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#f9fafb]">
              <span className="text-[13px]">{c.name} <span className="text-[#9ca3af]">({c.slug})</span></span>
              <button onClick={()=>deleteCategory(c.id)} className="text-[11px] text-red-500 hover:underline">删除</button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] p-5">
        <h2 className="text-[15px] font-semibold text-[#1f2937] mb-4">数据库迁移</h2>
        <p className="text-[13px] text-[#6b7280] mb-3">请在 Supabase SQL Editor 中执行以下迁移文件：</p>
        <ul className="text-[13px] text-[#6b7280] list-disc pl-5 space-y-1">
          <li><code className="text-[#1a7f5a] bg-[#e8f5ef] px-1 rounded">docs/migrations/admin-system.sql</code> — 超级管理员系统</li>
        </ul>
      </div>
    </div>
  );
}
