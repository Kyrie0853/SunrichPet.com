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
  console.log("[Alipay] ALIPAY_PRIVATE_KEY :", process.env.ALIPAY_PRIVATE_KEY
    ? `✅ 已设置(${process.env.ALIPAY_PRIVATE_KEY.length}字符) 前30字符="${process.env.ALIPAY_PRIVATE_KEY.slice(0, 30).replace(/\n/g, '\\n')}"`
    : "❌ 未设置");
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
// 将 base64 内容按 64 字符分行（OpenSSL 3.x 严格要求）
// ──────────────────────────────────────────────
function wrapBase64Lines(content: string): string {
  const out: string[] = [];
  for (let i = 0; i < content.length; i += 64) {
    out.push(content.slice(i, i + 64));
  }
  return out.join("\n");
}

// ──────────────────────────────────────────────
// 密钥诊断：打印安全的格式信息
// ──────────────────────────────────────────────
function logKeyDiagnostics(raw: string, label: string) {
  const hasLiteralBackslashN = raw.includes("\\n");
  const hasRealNewline = raw.includes("\n");
  const hasCarriageReturn = raw.includes("\r");
  const startsWithBegin = raw.trimStart().startsWith("-----BEGIN");
  const endsWithEnd = raw.trimEnd().endsWith("-----");
  const strippedLen = raw.replace(/[\s\r\n-]+/g, "").length;
  // 安全前缀（不暴露完整密钥）
  const first80 = raw.slice(0, 80).replace(/\n/g, "\\n").replace(/\r/g, "\\r");
  const last30  = raw.slice(-30).replace(/\n/g, "\\n").replace(/\r/g, "\\r");

  const lineCount = raw.split("\n").length;
  console.log(`[Alipay] ═══ 密钥诊断 [${label}] ═══`);
  console.log(`[Alipay] 原始长度        : ${raw.length} 字符`);
  console.log(`[Alipay] 纯base64长度    : ${strippedLen} 字符`);
  console.log(`[Alipay] 含字面量 \\n     : ${hasLiteralBackslashN ? "是 ✅" : "否"}`);
  console.log(`[Alipay] 含真实换行(0x0A) : ${hasRealNewline ? `是 (${lineCount}行)` : "否 — 单行"}`);
  console.log(`[Alipay] 含 \\r (0x0D)     : ${hasCarriageReturn ? "是 ⚠️" : "否"}`);
  console.log(`[Alipay] 以 BEGIN 开头    : ${startsWithBegin ? "是" : "否 — 裸base64"}`);
  console.log(`[Alipay] 以 ----- 结尾    : ${endsWithEnd ? "是" : "否"}`);
  console.log(`[Alipay] 原文前80字符     : "${first80}"`);
  console.log(`[Alipay] 原文末30字符     : "${last30}"`);
  console.log(`[Alipay] ═══════════════════════════`);
}

// ──────────────────────────────────────────────
// 构造标准 PEM — 纯 base64 + 指定类型 + 64字符分行
// ──────────────────────────────────────────────
function buildPem(cleanB64: string, type: "pkcs1" | "pkcs8"): string {
  const header = type === "pkcs8"
    ? "-----BEGIN PRIVATE KEY-----"
    : "-----BEGIN RSA PRIVATE KEY-----";
  const footer = type === "pkcs8"
    ? "-----END PRIVATE KEY-----"
    : "-----END RSA PRIVATE KEY-----";
  const wrapped = wrapBase64Lines(cleanB64);
  return header + "\n" + wrapped + "\n" + footer + "\n";
}

// ──────────────────────────────────────────────
// RSA-SHA256 签名 — 激进重写，多重回退
// ──────────────────────────────────────────────
async function rsaSign(data: string, privateKeyPem: string): Promise<string> {
  const { createSign, createPrivateKey } = await import("crypto");

  // ── 0. 深度诊断 ──
  logKeyDiagnostics(privateKeyPem, "私钥(PRIVATE_KEY)");

  // ── 提取纯 base64（去掉所有非 base64 字符）──
  const cleanB64 = privateKeyPem
    .replace(/\\n/g, "\n")       // 字面量 \n → 真实换行
    .replace(/\r/g, "")          // 去掉 \r
    .replace(/-----.*?-----/g, "") // 去掉现存的 PEM 头尾
    .replace(/[\s]/g, "");        // 去掉所有空白（换行、空格等）

  console.log(`[Alipay] 纯base64长度: ${cleanB64.length}, 前60字符: ${cleanB64.slice(0, 60)}`);
  console.log(`[Alipay] 纯base64末30字符: ${cleanB64.slice(-30)}`);

  if (!cleanB64 || cleanB64.length < 100) {
    throw new Error(`密钥太短 (${cleanB64.length} 字符)，请检查 Vercel 中 ALIPAY_PRIVATE_KEY 是否完整粘贴`);
  }

  // ── 多策略尝试 ──
  const strategies: Array<{ label: string; pem: string }> = [];

  // 策略 1-2: 自动检测 + 显式指定
  const isPkcs8 = cleanB64.includes("BgkqhkiG9w0BAQEF");
  if (isPkcs8) {
    strategies.push({ label: "PKCS#8 (检测)", pem: buildPem(cleanB64, "pkcs8") });
    strategies.push({ label: "PKCS#1 (强制)", pem: buildPem(cleanB64, "pkcs1") });
  } else {
    strategies.push({ label: "PKCS#1 (检测)", pem: buildPem(cleanB64, "pkcs1") });
    strategies.push({ label: "PKCS#8 (强制)", pem: buildPem(cleanB64, "pkcs8") });
  }

  // 策略 3-4: 不换行版本（某些 OpenSSL 构建可能接受长行）
  strategies.push({
    label: "PKCS#8 不换行",
    pem: `-----BEGIN PRIVATE KEY-----\n${cleanB64}\n-----END PRIVATE KEY-----\n`,
  });
  strategies.push({
    label: "PKCS#1 不换行",
    pem: `-----BEGIN RSA PRIVATE KEY-----\n${cleanB64}\n-----END RSA PRIVATE KEY-----\n`,
  });

  let lastError: any = null;

  for (const strategy of strategies) {
    try {
      // 打印 PEM 摘要（安全）
      const pemLines = strategy.pem.split("\n");
      console.log(`[Alipay] 🔑 尝试策略: ${strategy.label} (${pemLines.length}行, ${strategy.pem.length}字节)`);
      console.log(`[Alipay]    PEM首行: ${pemLines[0]}`);
      console.log(`[Alipay]    PEM末行: ${pemLines[pemLines.length - 1]}`);
      console.log(`[Alipay]    首行base64长度: ${pemLines[1]?.length || 0}`);

      // 尝试解析
      const keyObj = createPrivateKey({
        key: strategy.pem,
        format: "pem",
        type: "pkcs8",  // Node.js 会自适配，这里给个提示
      } as any);
      console.log(`[Alipay] ✅ ${strategy.label} — 解析成功 (type:${keyObj.type}, keyType:${keyObj.asymmetricKeyType})`);

      // 签名
      const sign = createSign("RSA-SHA256");
      sign.update(data, "utf8");
      sign.end();
      const signature = sign.sign(keyObj, "base64");
      console.log(`[Alipay] ✅ ${strategy.label} — 签名成功 (长度:${signature.length})`);
      return signature;
    } catch (err: any) {
      console.warn(`[Alipay] ❌ ${strategy.label} 失败: ${err.code || ""} ${err.message}`);
      lastError = err;
    }
  }

  // ── 全部失败 ──
  console.error(`[Alipay] ❌ 全部 ${strategies.length} 种策略均失败`);
  console.error(`[Alipay] 最后错误: ${lastError?.code || ""} ${lastError?.message}`);
  throw new Error(
    `支付宝签名失败：已尝试 ${strategies.length} 种密钥格式均无法解析。\n` +
    `最后错误：${lastError?.message}\n` +
    "请确认 Vercel 中 ALIPAY_PRIVATE_KEY 的值：\n" +
    "1. 从支付宝开放平台 → 开发设置 → 接口加签方式 → 下载「应用私钥」\n" +
    "2. 用文本编辑器打开下载的文件，删除 -----BEGIN... 和 -----END... 行\n" +
    "3. 将所有真实换行替换为 \\n（两个字面量字符：反斜杠 + 字母n）\n" +
    "4. 将得到的单行文本粘贴到 Vercel 环境变量\n" +
    `当前纯base64长度: ${cleanB64.length}`
  );
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

    // 规范化公钥 PEM
    const cleanPubB64 = publicKeyRaw
      .replace(/\\n/g, "\n")
      .replace(/\r/g, "")
      .replace(/-----.*?-----/g, "")
      .replace(/[\s]/g, "");
    const wrappedPubB64 = wrapBase64Lines(cleanPubB64);
    const publicKey = `-----BEGIN PUBLIC KEY-----\n${wrappedPubB64}\n-----END PUBLIC KEY-----\n`;

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
