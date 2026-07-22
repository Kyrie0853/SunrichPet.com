"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function parsePastedText(text: string): { name: string; phone: string; address: string } {
  const trimmed = text.trim();

  // 提取手机号（11位1开头）
  const phoneMatch = trimmed.match(/1[3-9]\d{9}/);
  const phone = phoneMatch ? phoneMatch[0] : "";

  // 去掉手机号后的剩余文本
  let remaining = trimmed;
  if (phone) {
    remaining = trimmed.replace(phone, "").trim();
    // 清理多余空格和逗号
    remaining = remaining.replace(/[,，\s]+/g, " ").trim();
  }

  // 尝试从剩余文本中拆分姓名（前2-4个中文字符 或 2-20个英文字母）
  const nameMatch = remaining.match(/^[一-龥]{2,4}|^[a-zA-Z]{2,20}/);
  const name = nameMatch ? nameMatch[0] : "";

  // 其余部分作为地址
  const address = name ? remaining.slice(name.length).trim() : remaining;

  return { name, phone, address };
}

export default function PurchaseForm({
  productId,
  productName,
  price,
}: {
  productId: string;
  productName: string;
  price: number;
}) {
  const router = useRouter();
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [buyerMessage, setBuyerMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 智能粘贴
  const [pasteText, setPasteText] = useState("");
  const [pasteDone, setPasteDone] = useState(false);

  function handlePasteChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setPasteText(val);

    if (val.trim().length > 8) {
      const parsed = parsePastedText(val);
      if (parsed.name || parsed.phone || parsed.address) {
        if (parsed.name) setRecipientName(parsed.name);
        if (parsed.phone) setRecipientPhone(parsed.phone);
        if (parsed.address) setRecipientAddress(parsed.address);
        setPasteDone(true);
      }
    }
  }

  async function handleSubmit() {
    if (!recipientName.trim()) { setError("请填写收货人姓名"); return; }
    if (!recipientPhone.trim() || !/^1[3-9]\d{9}$/.test(recipientPhone.trim())) {
      setError("请填写正确的手机号（11位）"); return;
    }
    if (!recipientAddress.trim()) { setError("请填写详细地址"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          recipient_name: recipientName.trim(),
          recipient_phone: recipientPhone.trim(),
          recipient_address: recipientAddress.trim(),
          buyer_message: buyerMessage.trim(),
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      if (data.payUrl) {
        window.location.href = data.payUrl;
      } else {
        router.push("/orders/" + data.orderId);
      }
    } catch {
      setError("网络错误，请重试");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 智能粘贴识别 */}
      {!pasteDone && (
        <div className="rounded-xl border-2 border-dashed border-[#1a7f5a]/30 bg-[#f0faf5] p-4">
          <label className="mb-1 block text-[13px] font-semibold text-[#1a7f5a]">
            📋 粘贴识别
          </label>
          <input
            type="text"
            value={pasteText}
            onChange={handlePasteChange}
            placeholder="复制姓名、电话和地址，粘贴到此处自动识别"
            className="w-full rounded-xl border border-[#1a7f5a]/20 bg-white px-4 py-3 text-[15px] outline-none focus:border-[#1a7f5a]"
          />
          <p className="mt-1.5 text-[11px] text-[#6b7280]">
            示例：张三 13800138000 北京市朝阳区某某路10号
          </p>
        </div>
      )}

      {pasteDone && (
        <div className="rounded-xl bg-[#f0faf5] border border-[#1a7f5a]/20 px-4 py-2.5 flex items-center gap-2">
          <span className="text-[#1a7f5a] text-[13px]">✅ 已识别并填写</span>
          <button
            onClick={() => { setPasteDone(false); setPasteText(""); }}
            className="ml-auto text-[12px] text-[#1a7f5a] underline"
          >
            重新粘贴
          </button>
        </div>
      )}

      {/* 收货人 */}
      <div>
        <label className="mb-1 block text-[14px] font-semibold text-[#1f2937]">
          收货人 *
        </label>
        <input
          type="text"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          placeholder="姓名"
          className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-[16px] outline-none focus:border-[#1a7f5a] min-h-[48px]"
        />
      </div>

      {/* 手机号 */}
      <div>
        <label className="mb-1 block text-[14px] font-semibold text-[#1f2937]">
          手机号 *
        </label>
        <input
          type="tel"
          value={recipientPhone}
          onChange={(e) => setRecipientPhone(e.target.value)}
          placeholder="11位手机号"
          maxLength={11}
          className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-[16px] outline-none focus:border-[#1a7f5a] min-h-[48px]"
        />
      </div>

      {/* 详细地址 */}
      <div>
        <label className="mb-1 block text-[14px] font-semibold text-[#1f2937]">
          详细地址 *
        </label>
        <textarea
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          placeholder="省/市/区 + 街道 + 门牌号"
          rows={3}
          className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-[16px] outline-none focus:border-[#1a7f5a] resize-none min-h-[48px]"
        />
      </div>

      {/* 买家留言 */}
      <div>
        <label className="mb-1 block text-[14px] font-semibold text-[#1f2937]">
          买家留言（选填）
        </label>
        <textarea
          value={buyerMessage}
          onChange={(e) => setBuyerMessage(e.target.value)}
          placeholder="如有特殊要求请在此留言..."
          rows={2}
          className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-[16px] outline-none focus:border-[#1a7f5a] resize-none"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-600">{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full rounded-xl bg-[#1a7f5a] py-4 text-[15px] font-bold text-white hover:bg-[#166b4b] transition-colors disabled:opacity-50 active:scale-[0.98] min-h-[48px]"
      >
        {loading ? "提交中..." : `提交订单 · ¥${price.toFixed(2)}`}
      </button>

      <p className="text-center text-[12px] text-[#9ca3af]">
        点击提交后将跳转支付宝完成支付，付款到担保账户
      </p>
    </div>
  );
}
