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
  const [paymentMethod, setPaymentMethod] = useState<"alipay" | "wechat">("alipay");
  const [orderId, setOrderId] = useState("");
  const [orderCreated, setOrderCreated] = useState(false);

  // 智能粘贴
  const [pasteText, setPasteText] = useState("");
  const [pasteDone, setPasteDone] = useState(false);

  // ── 防护：price 不是数字时页面不应崩溃（防止 React Error #418）──
  const safePrice = (() => {
    if (typeof price === "number" && !isNaN(price)) return price;
    if (typeof price === "string") {
      const n = Number(price);
      if (!isNaN(n)) return n;
    }
    return 0;
  })();
  if (safePrice === 0 && price != null && price !== 0) {
    console.error("[PurchaseForm] ⚠️ price 不是有效数字:", typeof price, JSON.stringify(price));
  }

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
    console.log("[PurchaseForm] 🔘 handleSubmit 被触发");
    console.log("[PurchaseForm] 当前状态:", {
      recipientName, recipientPhone, recipientAddress,
      paymentMethod, loading
    });
    console.log("[PurchaseForm] Props:", { productId, productName, price: safePrice });

    // ── 表单验证 ──
    if (!recipientName.trim()) {
      console.warn("[PurchaseForm] ❌ 验证失败: 收货人姓名为空");
      setError("请填写收货人姓名"); return;
    }
    if (!recipientPhone.trim() || !/^1[3-9]\d{9}$/.test(recipientPhone.trim())) {
      console.warn("[PurchaseForm] ❌ 验证失败: 手机号不合法", recipientPhone);
      setError("请填写正确的手机号（11位）"); return;
    }
    if (!recipientAddress.trim()) {
      console.warn("[PurchaseForm] ❌ 验证失败: 地址为空");
      setError("请填写详细地址"); return;
    }
    console.log("[PurchaseForm] ✅ 表单验证通过");

    setLoading(true);
    setError("");
    try {
      console.log("[PurchaseForm] 📡 发起 POST /api/orders/create ...");
      const requestBody = {
        product_id: productId,
        recipient_name: recipientName.trim(),
        recipient_phone: recipientPhone.trim(),
        recipient_address: recipientAddress.trim(),
        buyer_message: buyerMessage.trim(),
        payment_method: paymentMethod,
      };
      console.log("[PurchaseForm] 请求体:", JSON.stringify(requestBody));

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      console.log("[PurchaseForm] 📡 响应状态:", res.status, res.statusText);

      const data = await res.json();
      console.log("[PurchaseForm] 📡 响应数据:", JSON.stringify(data));

      // 检查错误
      if (data.error) {
        console.error("[PurchaseForm] ❌ API 返回错误:", data.error);
        setError(data.error); setLoading(false);
        return;
      }

      // ── 支付宝支付：必须有 payUrl 才能跳转 ──
      if (paymentMethod === "alipay") {
        if (!data.payUrl) {
          console.error("[PurchaseForm] ❌ 支付宝 payUrl 为 null — 可能是后端环境变量未配置");
          setError("支付宝支付通道暂时不可用，请稍后重试或联系客服（错误码：PAYURL_NULL）");
          setLoading(false);
          return;
        }
        setOrderId(data.orderId);
        console.log("[PurchaseForm] ✅ 获取到支付宝支付URL");
        console.log("[PurchaseForm] 订单ID:", data.orderId);
        console.log("[PurchaseForm] 即将跳转到支付宝...");
        window.location.href = data.payUrl;
        // 跳转后不需要 setLoading(false)，页面将离开
        return;
      }

      // ── 微信支付：显示收款码 ──
      if (paymentMethod === "wechat") {
        setOrderId(data.orderId);
        setOrderCreated(true);
        setLoading(false);
        return;
      }

      // 未知支付方式
      console.error("[PurchaseForm] ❌ 未知支付方式:", paymentMethod);
      setError("不支持的支付方式");
      setLoading(false);
    } catch (err: any) {
      console.error("[PurchaseForm] ❌ 网络异常:", err.message || err);
      setError("网络错误，请重试");
      setLoading(false);
    }
  }

  // 微信支付已创建订单界面
  if (orderCreated && paymentMethod === "wechat") {
    const shortId = orderId.slice(-8).toUpperCase();
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-gradient-to-b from-green-50 to-white border border-green-200 p-6 text-center">
          <p className="text-4xl mb-3">💚</p>
          <h2 className="text-[16px] font-bold text-[#1f2937] mb-1">订单已创建</h2>
          <p className="text-[13px] text-[#6b7280]">请保存以下信息，使用微信扫码支付</p>
          <div className="my-5 flex justify-center">
            <div className="w-48 h-48 bg-white rounded-xl border-2 border-dashed border-[#1a7f5a]/30 flex items-center justify-center relative overflow-hidden">
              <img src="/images/wechat-qr.png" alt="微信收款码"
                className="w-44 h-44 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <span className="text-[10px] text-gray-400 text-center px-2">请将微信收款码<br/>放至 /public/images/wechat-qr.png</span>
            </div>
          </div>
          <div className="rounded-xl bg-white border p-3 text-left space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-gray-500">订单编号</span><span className="font-mono font-bold">{shortId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">应付金额</span><span className="font-bold text-[#1a7f5a] text-[18px]">¥{safePrice.toFixed(2)}</span></div>
          </div>
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-[12px] text-amber-700 text-left">
            <p className="font-bold mb-1">⚠️ 转账备注</p>
            <p>请在微信转账<strong>备注</strong>中填写：<code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono font-bold">{shortId}</code></p>
            <p className="mt-1">我们核对后将确认收款，订单自动更新。</p>
          </div>
        </div>
        <a href={"/orders/" + orderId}
          className="block w-full rounded-xl bg-[#1a7f5a] py-4 text-center text-[15px] font-bold text-white hover:bg-[#166b4b] transition-colors min-h-[48px]">
          查看订单
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 支付方式选择 */}
      <div>
        <label className="mb-2 block text-[14px] font-semibold text-[#1f2937]">支付方式</label>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setPaymentMethod("alipay")}
            className={"rounded-xl border-2 p-4 text-left transition-all " +
              (paymentMethod === "alipay" ? "border-[#1a7f5a] bg-[#e8f5ef]" : "border-[#e5e7eb] hover:border-[#1a7f5a]/30")}>
            <div className="flex items-center gap-2">
              <span className="text-xl">💙</span>
              <div><p className="text-[14px] font-semibold">支付宝</p><p className="text-[11px] text-[#9ca3af]">担保交易 · 推荐</p></div>
            </div>
            {paymentMethod === "alipay" && <span className="inline-block mt-2 rounded-full bg-[#1a7f5a] px-2 py-0.5 text-[10px] text-white">当前选择</span>}
          </button>
          <button type="button" onClick={() => setPaymentMethod("wechat")}
            className={"rounded-xl border-2 p-4 text-left transition-all " +
              (paymentMethod === "wechat" ? "border-[#1a7f5a] bg-[#e8f5ef]" : "border-[#e5e7eb] hover:border-[#1a7f5a]/30")}>
            <div className="flex items-center gap-2">
              <span className="text-xl">💚</span>
              <div><p className="text-[14px] font-semibold">微信转账</p><p className="text-[11px] text-[#9ca3af]">扫码支付</p></div>
            </div>
            {paymentMethod === "wechat" && <span className="inline-block mt-2 rounded-full bg-[#1a7f5a] px-2 py-0.5 text-[10px] text-white">当前选择</span>}
          </button>
        </div>
        <div className="mt-2 rounded-lg bg-[#f0faf5] px-3 py-2 text-[11px] text-[#1a7f5a]">
          {paymentMethod === "alipay" ? "🛡️ 资金由支付宝托管，收货满意后再结算" : "💚 扫码转账并在备注中填写订单编号，我们核对后确认"}
        </div>
      </div>

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
        {loading ? "提交中..." : `提交订单 · ¥${safePrice.toFixed(2)}` + (paymentMethod === "wechat" ? " (微信)" : "")}
      </button>

      <p className="text-center text-[12px] text-[#9ca3af]">
        {paymentMethod === "alipay" ? "提交后跳转支付宝担保支付" : "提交后显示微信收款码"}
      </p>
    </div>
  );
}
