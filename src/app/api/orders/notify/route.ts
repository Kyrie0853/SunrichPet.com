import { NextResponse } from "next/server";
import { verifyAlipayNotify, handlePaymentSuccess } from "@/lib/studio/alipay";

export async function POST(req: Request) {
  console.log("[Notify API] ═══════════════════════════════════");
  console.log("[Notify API] 📨 收到支付宝异步通知请求");
  console.log("[Notify API] 请求方法:", req.method);
  console.log("[Notify API] 请求来源:", req.headers.get("x-forwarded-for") || "未知");
  console.log("[Notify API] Content-Type:", req.headers.get("content-type"));

  try {
    const body = await req.text();
    console.log("[Notify API] 原始body长度:", body.length);
    console.log("[Notify API] 原始body(前300):", body.slice(0, 300));

    const params = Object.fromEntries(new URLSearchParams(body));
    console.log("[Notify API] 解析参数数量:", Object.keys(params).length);

    // 验签
    const isValid = await verifyAlipayNotify(params);
    if (!isValid) {
      console.error("[Notify API] ❌ 签名验证失败，返回 fail");
      return new NextResponse("fail", { status: 400 });
    }

    const tradeStatus = params.trade_status;
    const outTradeNo = params.out_trade_no;
    const tradeNo = params.trade_no;

    console.log("[Notify API] trade_status:", tradeStatus);
    console.log("[Notify API] out_trade_no:", outTradeNo);
    console.log("[Notify API] trade_no    :", tradeNo);

    if (!outTradeNo || !tradeNo) {
      console.error("[Notify API] ❌ 缺少必要参数 out_trade_no 或 trade_no");
      return new NextResponse("fail", { status: 400 });
    }

    if (tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED") {
      console.log("[Notify API] 交易状态为 " + tradeStatus + "，开始处理...");
      await handlePaymentSuccess(outTradeNo, tradeNo);
    } else {
      console.log("[Notify API] ⚠️ 交易状态为 " + tradeStatus + "，非成功状态，跳过处理");
    }

    console.log("[Notify API] ✅ 通知处理完成，返回 success");
    return new NextResponse("success");
  } catch (err: any) {
    console.error("[Notify API] ❌ 异常:", err.message);
    console.error("[Notify API] 错误堆栈:", err.stack);
    return new NextResponse("fail", { status: 500 });
  }
}
