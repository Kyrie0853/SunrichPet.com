import { createClient } from "@/lib/supabase/server";

const ALIPAY_GATEWAY = process.env.ALIPAY_SANDBOX === "true"
  ? "https://openapi-sandbox.dl.alipaydev.com/gateway.do"
  : "https://openapi.alipay.com/gateway.do";

function buildSignString(params: Record<string, string>) {
  const sorted = Object.keys(params)
    .filter(k => params[k] && k !== "sign" && k !== "sign_type")
    .sort();
  return sorted.map(k => `${k}=${params[k]}`).join("&");
}

export async function createAlipayOrder(params: {
  orderId: string;
  productName: string;
  totalAmount: number;
  buyerMessage?: string;
}) {
  const { orderId, productName, totalAmount, buyerMessage } = params;

  const bizContent = JSON.stringify({
    out_trade_no: orderId,
    product_code: "FAST_INSTANT_TRADE_PAY",
    total_amount: totalAmount.toFixed(2),
    subject: productName,
    body: buyerMessage || productName,
  });

  const requestParams: Record<string, string> = {
    app_id: process.env.ALIPAY_APP_ID || "",
    method: "alipay.trade.page.pay",
    format: "JSON",
    charset: "utf-8",
    sign_type: "RSA2",
    timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "+08:00"),
    version: "1.0",
    notify_url: process.env.ALIPAY_NOTIFY_URL || "",
    return_url: process.env.ALIPAY_RETURN_URL || "",
    biz_content: bizContent,
  };

  const signString = buildSignString(requestParams);
  const sign = await rsaSign(signString, process.env.ALIPAY_PRIVATE_KEY || "");

  const queryString = Object.entries(requestParams)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

  return `${ALIPAY_GATEWAY}?${queryString}&sign=${encodeURIComponent(sign)}`;
}

async function rsaSign(data: string, privateKeyPem: string): Promise<string> {
  // 使用浏览器或 Node.js 原生 crypto API 进行 RSA-SHA256 签名
  // 需要 Node.js 15+ 或使用 Web Crypto API
  try {
    const { createSign } = await import("crypto");
    const sign = createSign("RSA-SHA256");
    sign.update(data, "utf8");
    sign.end();
    return sign.sign(privateKeyPem, "base64");
  } catch {
    // 如果 crypto 不可用，返回占位符（测试环境）
    console.warn("RSA signing not available — using mock signature");
    return "MOCK_SIGNATURE_" + Buffer.from(data).toString("base64").slice(0, 20);
  }
}

export async function verifyAlipayNotify(params: Record<string, string>): Promise<boolean> {
  try {
    const sign = params.sign || "";
    const signType = params.sign_type || "RSA2";
    const signString = buildSignString(params);

    if (process.env.ALIPAY_SANDBOX === "true") {
      // 沙箱模式简化验签
      console.log("Sandbox mode — skip signature verification");
      return true;
    }

    const { createVerify } = await import("crypto");
    const verify = createVerify("RSA-SHA256");
    verify.update(signString, "utf8");
    verify.end();
    return verify.verify(process.env.ALIPAY_PUBLIC_KEY || "", sign, "base64");
  } catch (err) {
    console.error("Alipay signature verification failed:", err);
    return false;
  }
}

export async function handlePaymentSuccess(orderId: string, tradeNo: string) {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) {
    console.error("Order not found:", orderId);
    return;
  }

  if (order.status === "pending") {
    const now = new Date().toISOString();
    await supabase.from("orders").update({
      status: "paid",
      paid_at: now,
      alipay_trade_no: tradeNo,
    }).eq("id", orderId);

    await supabase.from("order_logs").insert({
      order_id: orderId,
      action: "paid",
      details: { tradeNo, method: "alipay" },
    });

    console.log(`Order ${orderId} paid successfully, trade_no: ${tradeNo}`);
  } else {
    console.log(`Order ${orderId} already in status: ${order.status}, skipping`);
  }
}
