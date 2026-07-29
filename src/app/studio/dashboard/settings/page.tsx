"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function StudioSettingsPage() {
  const [qrUploading, setQrUploading] = useState(false);
  const [qrMessage, setQrMessage] = useState("");
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const supabase = createClient();

  // 加载当前收款码
  useEffect(() => {
    async function loadQr() {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "wechat_qr_url")
          .maybeSingle();
        if (data?.value) setQrPreview(data.value);
      } catch {
        // 表可能尚未创建
      }
    }
    loadQr();
  }, [supabase]);

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
      const fileName = `wechat-qr-${Date.now()}.${file.name.split(".").pop()}`;

      // 尝试上传到 public bucket
      const { error: uploadErr } = await supabase.storage
        .from("public")
        .upload(`qr/${fileName}`, file, {
          cacheControl: "3600",
          upsert: true,
        });

      let publicUrl = "";

      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("public").getPublicUrl(`qr/${fileName}`);
        publicUrl = urlData.publicUrl;
      } else {
        // 如果 storage 不可用，使用本地静态文件提示
        setQrMessage("⚠️ Storage 未配置。请将收款码放入 public/images/wechat-qr.png");
        setQrUploading(false);
        return;
      }

      // 保存到 site_settings
      const { error: upsertErr } = await supabase
        .from("site_settings")
        .upsert({ key: "wechat_qr_url", value: publicUrl }, { onConflict: "key" });

      if (upsertErr) {
        setQrMessage("❌ 保存配置失败：" + upsertErr.message);
      } else {
        setQrPreview(publicUrl);
        setQrMessage("✅ 收款码上传成功！买家下单时将看到此收款码。");
      }
    } catch (err: any) {
      setQrMessage("❌ 上传失败：" + (err.message || "未知错误"));
    } finally {
      setQrUploading(false);
    }
  }

  return (
    <div>
      <h1 className="text-lg md:text-xl font-semibold text-[#1f2937] mb-4 md:mb-6">收款码设置</h1>

      <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] p-4 md:p-6">
        <h2 className="text-[15px] font-semibold text-[#1f2937] mb-2">💚 微信收款码</h2>
        <p className="text-[13px] text-[#6b7280] mb-4">
          上传微信收款码后，买家提交订单时会自动展示此收款码。买家扫码支付后在备注中填写订单编号，管理员核对后确认收款。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {/* 预览 */}
          <div className="w-48 h-48 rounded-xl border-2 border-dashed border-[#e5e7eb] flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
            {qrPreview ? (
              <img src={qrPreview} alt="微信收款码" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center px-3">
                <span className="text-3xl block mb-1">📷</span>
                <span className="text-[#9ca3af] text-[12px]">未上传<br />收款码</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <label className="inline-block rounded-full bg-[#1a7f5a] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#166b4b] cursor-pointer transition-colors min-h-[44px] flex items-center">
              {qrUploading ? "上传中..." : qrPreview ? "更换收款码" : "上传收款码"}
              <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" disabled={qrUploading} />
            </label>
            <p className="text-[11px] text-[#9ca3af]">支持 JPG/PNG，大小不超过 2MB</p>
            <p className="text-[12px] text-[#6b7280]">
              建议使用清晰的收款码图片，确保买家可以顺利扫码。
            </p>
            {qrMessage && (
              <div className={"rounded-lg p-3 text-[13px] " + (qrMessage.startsWith("✅") ? "bg-[#e8f5ef] text-[#1a7f5a]" : "bg-red-50 text-red-600")}>
                {qrMessage}
              </div>
            )}
          </div>
        </div>

        {/* 提示信息 */}
        <div className="mt-6 p-4 rounded-xl bg-[#e8f5ef] border border-[#1a7f5a]/20">
          <h3 className="text-[13px] font-semibold text-[#1a7f5a] mb-2">📌 收款流程说明</h3>
          <ol className="text-[12px] text-[#4b5563] list-decimal list-inside space-y-1">
            <li>买家提交订单 → 看到收款码 → 微信扫码支付</li>
            <li>买家在微信转账备注中填写订单编号</li>
            <li>管理员在"订单管理"中核对转账 → 点击"确认收款"</li>
            <li>订单状态更新为"已付款" → 管理员安排发货</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
