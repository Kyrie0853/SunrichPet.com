"use client";

import { useState } from "react";

function parsePastedText(text: string): { name: string; phone: string; address: string } {
  const trimmed = text.trim();

  // 提取手机号（11位1开头）
  const phoneMatch = trimmed.match(/1[3-9]\d{9}/);
  const phone = phoneMatch ? phoneMatch[0] : "";

  // 去掉手机号后的剩余文本
  let remaining = trimmed;
  if (phone) {
    remaining = trimmed.replace(phone, "").trim();
    remaining = remaining.replace(/[,，\s]+/g, " ").trim();
  }

  // 从剩余文本中拆分姓名（前2-4个中文字符 或 2-20个英文字母）
  const nameMatch = remaining.match(/^[一-龥]{2,4}|^[a-zA-Z]{2,20}/);
  const name = nameMatch ? nameMatch[0] : "";

  const address = name ? remaining.slice(name.length).trim() : remaining;

  return { name, phone, address };
}

interface CartProductInfo {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function PurchaseForm({
  productId,
  productName,
  price,
  cartItems,
  onOrderCreated,
}: {
  productId: string;
  productName: string;
  price: number;
  cartItems?: CartProductInfo[];
  onOrderCreated?: () => void;
}) {
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [buyerMessage, setBuyerMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orderCreated, setOrderCreated] = useState(false);
  const [qrError, setQrError] = useState(false);

  // 智能粘贴
  const [pasteText, setPasteText] = useState("");
  const [pasteDone, setPasteDone] = useState(false);

  // ── 防护：price 不是数字时页面不应崩溃 ──
  const safePrice = (() => {
    if (typeof price === "number" && !isNaN(price)) return price;
    if (typeof price === "string") {
      const n = Number(price);
      if (!isNaN(n)) return n;
    }
    return 0;
  })();

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
    // ── 表单验证 ──
    if (!recipientName.trim()) {
      setError("请填写收货人姓名"); return;
    }
    if (!recipientPhone.trim() || !/^1[3-9]\d{9}$/.test(recipientPhone.trim())) {
      setError("请填写正确的手机号（11位）"); return;
    }
    if (!recipientAddress.trim()) {
      setError("请填写详细地址"); return;
    }

    setLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        product_id: productId,
        recipient_name: recipientName.trim(),
        recipient_phone: recipientPhone.trim(),
        recipient_address: recipientAddress.trim(),
        buyer_message: buyerMessage.trim(),
        payment_method: "wechat",
      };

      // 如果是购物车结算，传递所有商品
      if (cartItems && cartItems.length > 0) {
        body.items = cartItems.map(item => ({
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        }));
      }

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error); setLoading(false);
        return;
      }

      // 下单成功，清空购物车
      if (onOrderCreated) onOrderCreated();

      setOrderId(data.orderId);
      setOrderCreated(true);
      setLoading(false);
    } catch (err: any) {
      setError("网络错误，请重试");
      setLoading(false);
    }
  }

  // ── 订单创建成功 → 显示收款码 ──
  if (orderCreated) {
    const shortId = orderId.slice(-8).toUpperCase();
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-gradient-to-b from-green-50 to-white border border-green-200 p-6 text-center">
          <p className="text-4xl mb-3">✅</p>
          <h2 className="text-[16px] font-bold text-[#1f2937] mb-1">订单已提交！</h2>
          <p className="text-[13px] text-[#6b7280] mb-4">
            请添加客服微信完成支付，备注您的订单编号
          </p>

          {/* 微信收款码 */}
          <div className="my-5 flex justify-center">
            <div className="relative w-60 h-60 sm:w-72 sm:h-72 bg-white rounded-2xl border-2 border-[#1a7f5a]/20 shadow-sm flex items-center justify-center overflow-hidden">
              {!qrError && (
                <img
                  src="/images/wechat-qr.png"
                  alt="微信收款码"
                  className="w-full h-full object-contain p-1"
                  onError={() => setQrError(true)}
                />
              )}
              {qrError && (
                <div className="flex flex-col items-center justify-center gap-2 p-4">
                  <span className="text-3xl">📷</span>
                  <span className="text-[12px] text-gray-400 text-center">
                    收款码图片未配置<br />请联系管理员上传
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white border p-3 text-left space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-gray-500">订单编号</span><span className="font-mono font-bold text-[#1a7f5a]">#{shortId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">应付金额</span><span className="font-bold text-[#1a7f5a] text-[18px]">¥{safePrice.toFixed(2)}</span></div>
          </div>

          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-[12px] text-amber-700 text-left">
            <p className="font-bold mb-1">💡 支付流程</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>扫描上方微信收款码</li>
              <li>转账 <strong>¥{safePrice.toFixed(2)}</strong></li>
              <li>在转账<strong>备注</strong>中填写：<code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono font-bold">{shortId}</code></li>
              <li>支付完成后，客服将确认收款并安排发货</li>
            </ol>
          </div>

          <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3 text-[12px] text-blue-700 text-left">
            <p className="font-bold mb-1">📞 客服微信</p>
            <p>如有疑问，请添加客服微信：<strong>geiwopa112</strong></p>
          </div>
        </div>
        <a href={"/orders/" + orderId}
          className="block w-full rounded-xl bg-[#1a7f5a] py-4 text-center text-[15px] font-bold text-white hover:bg-[#166b4b] transition-colors min-h-[48px]">
          查看订单状态
        </a>
        <a href="/shop"
          className="block w-full rounded-xl border border-[#d1d5db] py-3 text-center text-[14px] font-medium text-[#6b7280] hover:bg-[#f9fafb] transition-colors">
          继续逛逛
        </a>
      </div>
    );
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
            className="w-full rounded-xl border border-[#1a7f5a]/20 bg-white px-4 py-3 text-[16px] outline-none focus:border-[#1a7f5a]"
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
        {loading ? "提交中..." : `提交订单 · ¥${safePrice.toFixed(2)}`}
      </button>

      <p className="text-center text-[12px] text-[#9ca3af]">
        提交后显示微信收款码，扫码支付即可
      </p>
    </div>
  );
}
