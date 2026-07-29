"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminSettingsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [loading, setLoading] = useState(false);

  // 收款码上传
  const [qrUploading, setQrUploading] = useState(false);
  const [qrMessage, setQrMessage] = useState("");
  const [qrPreview, setQrPreview] = useState<string | null>(null);

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

  // ── 微信收款码上传 ──
  async function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setQrMessage("请选择图片文件");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setQrMessage("图片大小不能超过 2MB");
      return;
    }

    setQrUploading(true);
    setQrMessage("");

    try {
      // 上传到 Supabase Storage
      const fileName = `wechat-qr-${Date.now()}.${file.name.split(".").pop()}`;
      const { error: uploadErr } = await supabase.storage
        .from("public")
        .upload(`qr/${fileName}`, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadErr) throw uploadErr;

      // 获取公开 URL
      const { data: urlData } = supabase.storage.from("public").getPublicUrl(`qr/${fileName}`);
      const publicUrl = urlData.publicUrl;

      // 保存到 site_settings 表
      await supabase.from("site_settings").upsert({
        key: "wechat_qr_url",
        value: publicUrl,
      }, { onConflict: "key" });

      setQrPreview(publicUrl);
      setQrMessage("✅ 收款码上传成功！");
    } catch (err: any) {
      setQrMessage("❌ 上传失败：" + (err.message || "未知错误"));
    } finally {
      setQrUploading(false);
    }
  }

  // 加载当前收款码
  useEffect(() => {
    async function loadQr() {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "wechat_qr_url").single();
      if (data?.value) setQrPreview(data.value);
    }
    loadQr();
  }, [supabase]);

  return (
    <div>
      <h1 className="text-lg md:text-xl font-semibold text-[#1f2937] mb-4 md:mb-6">系统设置</h1>

      {/* 微信收款码设置 */}
      <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] p-4 md:p-5 mb-4 md:mb-6">
        <h2 className="text-[15px] font-semibold text-[#1f2937] mb-4">💚 微信收款码设置</h2>
        <p className="text-[13px] text-[#6b7280] mb-3">
          上传收款码后，买家提交订单时会自动展示此收款码图片。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {/* 预览 */}
          <div className="w-40 h-40 rounded-xl border-2 border-dashed border-[#e5e7eb] flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
            {qrPreview ? (
              <img src={qrPreview} alt="微信收款码" className="w-full h-full object-contain" />
            ) : (
              <span className="text-[#9ca3af] text-[12px] text-center px-2">未上传<br />收款码</span>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <label className="inline-block rounded-full bg-[#1a7f5a] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#166b4b] cursor-pointer transition-colors min-h-[44px] flex items-center">
              {qrUploading ? "上传中..." : qrPreview ? "更换收款码" : "上传收款码"}
              <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" disabled={qrUploading} />
            </label>
            <p className="text-[11px] text-[#9ca3af]">支持 JPG/PNG，大小不超过 2MB</p>
            {qrMessage && (
              <p className={"text-[13px] " + (qrMessage.startsWith("✅") ? "text-[#1a7f5a]" : "text-red-500")}>
                {qrMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 商品分类管理 */}
      <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] p-4 md:p-5 mb-4 md:mb-6">
        <h2 className="text-[15px] font-semibold text-[#1f2937] mb-4">商品分类管理</h2>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="分类名称" className="h-10 md:h-9 rounded-lg border border-[#e5e7eb] px-3 text-[16px] md:text-[13px] outline-none focus:border-[#1a7f5a] w-full sm:flex-1" />
          <input value={newSlug} onChange={e=>setNewSlug(e.target.value)} placeholder="slug (英文)" className="h-10 md:h-9 rounded-lg border border-[#e5e7eb] px-3 text-[16px] md:text-[13px] outline-none focus:border-[#1a7f5a] w-full sm:w-32" />
          <button onClick={addCategory} disabled={loading} className="rounded-full bg-[#1a7f5a] px-4 py-2.5 md:py-2 text-[14px] md:text-[13px] font-medium text-white hover:bg-[#166b4b] disabled:opacity-50 min-h-[44px] md:min-h-0">添加</button>
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
          <li><code className="text-[#1a7f5a] bg-[#e8f5ef] px-1 rounded">docs/wechat-oauth-setup.sql</code> — 微信配置</li>
        </ul>
      </div>
    </div>
  );
}
