import { createClient } from "@/lib/supabase/server";

const ALIPAY_SANDBOX = process.env.ALIPAY_SANDBOX === "true";
const ALIPAY_GATEWAY = ALIPAY_SANDBOX
  ? "https://openapi-sandbox.dl.alipaydev.com/gateway.do"
  : "https://openapi.alipay.com/gateway.do";

// ──────────────────────────────────────────────
// 工具函数：生成支付宝规范的 yyyy-MM-dd HH:mm:ss 时间戳
// ──────────────────────────────────────────────
function formatAlipayTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

// ──────────────────────────────────────────────
// 签名字符串构造
// ──────────────────────────────────────────────
function buildSignString(params: Record<string, string>) {
  const sorted = Object.keys(params)
    .filter(k => params[k] && k !== "sign" && k !== "sign_type")
    .sort();
  return sorted.map(k => `${k}=${params[k]}`).join("&");
}

// ──────────────────────────────────────────────
// 环境变量诊断（仅输出是否存在，不泄露密钥内容）
// ──────────────────────────────────────────────
function logEnvDiagnostics() {
  console.log("[Alipay] ── 环境变量诊断 ──");
  console.log("[Alipay] ALIPAY_APP_ID      :", process.env.ALIPAY_APP_ID ? "✅ " + process.env.ALIPAY_APP_ID.slice(0, 6) + "***" : "❌ 未设置");
  console.log("[Alipay] ALIPAY_PRIVATE_KEY :", process.env.ALIPAY_PRIVATE_KEY ? "✅ 已设置(" + process.env.ALIPAY_PRIVATE_KEY.length + "字符)" : "❌ 未设置");
  console.log("[Alipay] ALIPAY_PUBLIC_KEY  :", process.env.ALIPAY_PUBLIC_KEY ? "✅ 已设置(" + process.env.ALIPAY_PUBLIC_KEY.length + "字符)" : "❌ 未设置");
  console.log("[Alipay] ALIPAY_NOTIFY_URL  :", process.env.ALIPAY_NOTIFY_URL || "❌ 未设置");
  console.log("[Alipay] ALIPAY_RETURN_URL  :", process.env.ALIPAY_RETURN_URL || "❌ 未设置");
  console.log("[Alipay] ALIPAY_SANDBOX     :", ALIPAY_SANDBOX ? "🔧 沙箱模式" : "🚀 生产模式");
  console.log("[Alipay] 网关地址            :", ALIPAY_GATEWAY);
  console.log("[Alipay] ──────────────────");
}

// ──────────────────────────────────────────────
// 创建支付宝网页支付订单 → 返回支付页面 URL
// ──────────────────────────────────────────────
export async function createAlipayOrder(params: {
  orderId: string;
  productName: string;
  totalAmount: number;
  buyerMessage?: string;
}) {
  const { orderId, productName, totalAmount, buyerMessage } = params;

  console.log("[Alipay] ═══ 开始创建支付宝订单 ═══");
  console.log("[Alipay] 订单ID     :", orderId);
  console.log("[Alipay] 商品名称   :", productName);
  console.log("[Alipay] 金额       : ¥" + totalAmount.toFixed(2));
  logEnvDiagnostics();

  // ── 环境变量校验 ──
  const appId = process.env.ALIPAY_APP_ID;
  const privateKey = process.env.ALIPAY_PRIVATE_KEY;
  const notifyUrl = process.env.ALIPAY_NOTIFY_URL;

  if (!appId) {
    console.error("[Alipay] ❌ 缺少 ALIPAY_APP_ID，无法创建订单");
    throw new Error("支付宝配置错误：缺少 APP_ID");
  }
  if (!privateKey) {
    console.error("[Alipay] ❌ 缺少 ALIPAY_PRIVATE_KEY，无法签名");
    throw new Error("支付宝配置错误：缺少私钥");
  }
  if (!notifyUrl) {
    console.warn("[Alipay] ⚠️ 未设置 ALIPAY_NOTIFY_URL，支付完成后可能无法自动更新订单状态");
  }

  const bizContent = JSON.stringify({
    out_trade_no: orderId,
    product_code: "FAST_INSTANT_TRADE_PAY",
    total_amount: totalAmount.toFixed(2),
    subject: productName,
    body: buyerMessage || productName,
  });

  console.log("[Alipay] 业务参数   :", bizContent);

  const requestParams: Record<string, string> = {
    app_id: appId,
    method: "alipay.trade.page.pay",
    format: "JSON",
    charset: "utf-8",
    sign_type: "RSA2",
    timestamp: formatAlipayTimestamp(),
    version: "1.0",
    notify_url: notifyUrl || "",
    return_url: process.env.ALIPAY_RETURN_URL || "",
    biz_content: bizContent,
  };

  // ── RSA2 签名 ──
  const signString = buildSignString(requestParams);
  console.log("[Alipay] 待签名字符串(前200字符):", signString.slice(0, 200) + "...");

  let sign: string;
  try {
    sign = await rsaSign(signString, privateKey);
    console.log("[Alipay] ✅ RSA2 签名成功 (长度:" + sign.length + ")");
  } catch (signErr: any) {
    console.error("[Alipay] ❌ RSA2 签名失败:", signErr.message);
    throw new Error("支付宝签名失败：" + signErr.message);
  }

  // ── 拼接完整 URL ──
  const queryString = Object.entries(requestParams)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

  const payUrl = `${ALIPAY_GATEWAY}?${queryString}&sign=${encodeURIComponent(sign)}`;

  console.log("[Alipay] ✅ 支付URL已生成");
  console.log("[Alipay] 网关       :", ALIPAY_GATEWAY);
  console.log("[Alipay] URL长度    :", payUrl.length);
  console.log("[Alipay] URL(前150) :", payUrl.slice(0, 150) + "...");
  console.log("[Alipay] ═══ 支付宝订单创建完成 ═══");

  return payUrl;
}

// ──────────────────────────────────────────────
// 规范化 PEM 密钥（处理环境变量的常见格式问题）
// ──────────────────────────────────────────────
function normalizePemKey(raw: string, label: string): string {
  if (!raw || typeof raw !== "string") {
    throw new Error(`${label} 为空或不是字符串`);
  }

  // 1. 替换字面量 \n 为实际换行符（Vercel 环境变量不会自动转换）
  let key = raw.replace(/\\n/g, "\n");

  // 2. 去除 \r 和首尾空白
  key = key.replace(/\r/g, "").trim();

  // 3. 确保 PEM 头尾各占一行（处理粘贴时丢失换行的情况）
  //    例如 "-----BEGIN RSA PRIVATE KEY-----MIIE..." → 补换行
  key = key.replace(
    /(-----BEGIN [A-Z ]+-----)([^\n])/,
    "$1\n$2"
  );
  key = key.replace(
    /([^\n])(-----END [A-Z ]+-----)/,
    "$1\n$2"
  );

  // 4. 确保末尾有换行
  if (!key.endsWith("\n")) {
    key += "\n";
  }

  // 诊断日志
  const firstLine = key.split("\n")[0] || "(空)";
  const lines = key.split("\n").length;
  console.log(`[Alipay] PEM诊断 [${label}]: 首行=${firstLine}, 总行数=${lines}, 总长度=${key.length}`);

  // 5. 检查是否是有效的 PEM 格式
  if (!firstLine.startsWith("-----BEGIN ")) {
    console.error(`[Alipay] ❌ ${label} 格式异常，首行:`, firstLine.slice(0, 80));
    throw new Error(
      `${label} 格式不正确。期望以 "-----BEGIN ..." 开头，实际首行: "${firstLine.slice(0, 50)}"。\n` +
      "请在 Vercel 环境变量中确保密钥值包含完整的 PEM 格式，换行处使用 \\n 表示。"
    );
  }

  return key;
}

// ──────────────────────────────────────────────
// RSA-SHA256 签名（Node.js crypto）
// ──────────────────────────────────────────────
async function rsaSign(data: string, privateKeyPem: string): Promise<string> {
  const key = normalizePemKey(privateKeyPem, "私钥(PRIVATE_KEY)");

  try {
    const { createSign } = await import("crypto");
    const sign = createSign("RSA-SHA256");
    sign.update(data, "utf8");
    sign.end();
    return sign.sign(key, "base64");
  } catch (err: any) {
    // 诊断更详细的错误
    console.error("[Alipay] ❌ 签名失败:", err.message);
    console.error("[Alipay] 密钥首行:", key.split("\n")[0]);
    console.error("[Alipay] 密钥长度:", key.length, "字节");
    throw new Error(
      `支付宝签名失败：${err.message}。\n` +
      "请检查 Vercel 中 ALIPAY_PRIVATE_KEY 的值：\n" +
      "1. 确保换行符使用 \\n 表示（例如 KEY-----\\nMIIE...\\n-----END）\n" +
      "2. 确保密钥以 -----BEGIN RSA PRIVATE KEY----- 开头\n" +
      "3. 如果使用支付宝密钥生成器，选择 PKCS1（非JAVA适用）格式"
    );
  }
}

// ──────────────────────────────────────────────
// 验证支付宝异步通知的签名
// ──────────────────────────────────────────────
export async function verifyAlipayNotify(params: Record<string, string>): Promise<boolean> {
  console.log("[Alipay Notify] ═══ 收到支付宝异步通知 ═══");
  console.log("[Alipay Notify] 通知参数数量:", Object.keys(params).length);
  console.log("[Alipay Notify] trade_status:", params.trade_status);
  console.log("[Alipay Notify] out_trade_no:", params.out_trade_no);
  console.log("[Alipay Notify] trade_no    :", params.trade_no);
  console.log("[Alipay Notify] total_amount:", params.total_amount);
  console.log("[Alipay Notify] sign_type   :", params.sign_type);
  console.log("[Alipay Notify] sign(前50)  :", (params.sign || "").slice(0, 50) + "...");

  try {
    const sign = params.sign || "";
    const signString = buildSignString(params);
    console.log("[Alipay Notify] 待验签字符串(前200):", signString.slice(0, 200) + "...");

    if (ALIPAY_SANDBOX) {
      console.log("[Alipay Notify] 🔧 沙箱模式 — 跳过验签");
      return true;
    }

    const publicKeyRaw = process.env.ALIPAY_PUBLIC_KEY;
    if (!publicKeyRaw) {
      console.error("[Alipay Notify] ❌ 缺少 ALIPAY_PUBLIC_KEY，无法验签");
      return false;
    }

    const publicKey = normalizePemKey(publicKeyRaw, "支付宝公钥(PUBLIC_KEY)");

    const { createVerify } = await import("crypto");
    const verify = createVerify("RSA-SHA256");
    verify.update(signString, "utf8");
    verify.end();
    const isValid = verify.verify(publicKey, sign, "base64");

    console.log("[Alipay Notify] 验签结果:", isValid ? "✅ 通过" : "❌ 失败");
    return isValid;
  } catch (err) {
    console.error("[Alipay Notify] ❌ 验签异常:", err);
    return false;
  }
}

// ──────────────────────────────────────────────
// 支付成功后更新订单状态：pending → paid
// ──────────────────────────────────────────────
export async function handlePaymentSuccess(orderId: string, tradeNo: string) {
  console.log("[Alipay] ═══ 处理支付成功回调 ═══");
  console.log("[Alipay] 订单ID   :", orderId);
  console.log("[Alipay] 交易号   :", tradeNo);

  const supabase = await createClient();

  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchErr || !order) {
    console.error("[Alipay] ❌ 订单不存在:", orderId, fetchErr?.message || "");
    return;
  }

  console.log("[Alipay] 当前状态 :", order.status);
  console.log("[Alipay] 订单金额 : ¥" + Number(order.total_amount).toFixed(2));

  if (order.status !== "pending") {
    console.log("[Alipay] ⚠️ 订单状态已是 '" + order.status + "'，跳过更新");
    return;
  }

  const now = new Date().toISOString();

  const { error: updateErr } = await supabase.from("orders").update({
    status: "paid",
    paid_at: now,
    alipay_trade_no: tradeNo,
  }).eq("id", orderId);

  if (updateErr) {
    console.error("[Alipay] ❌ 更新订单失败:", updateErr.message);
    return;
  }

  console.log("[Alipay] ✅ 订单状态已更新: pending → paid");

  // 记录操作日志
  const { error: logErr } = await supabase.from("order_logs").insert({
    order_id: orderId,
    action: "paid",
    details: { tradeNo, method: "alipay", paidAt: now },
  });

  if (logErr) {
    console.warn("[Alipay] ⚠️ 日志记录失败:", logErr.message);
  } else {
    console.log("[Alipay] ✅ 支付日志已记录");
  }

  console.log("[Alipay] ═══ 支付回调处理完成 ═══");
}
