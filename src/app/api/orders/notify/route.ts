import { NextResponse } from "next/server";
import { verifyAlipayNotify, handlePaymentSuccess } from "@/lib/studio/alipay";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const params = Object.fromEntries(new URLSearchParams(body));

    const isValid = await verifyAlipayNotify(params);
    if (!isValid) {
      console.error("Alipay signature verification failed");
      return new NextResponse("fail", { status: 400 });
    }

    const tradeStatus = params.trade_status;
    const outTradeNo = params.out_trade_no;
    const tradeNo = params.trade_no;

    if (!outTradeNo || !tradeNo) {
      return new NextResponse("fail", { status: 400 });
    }

    if (tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED") {
      await handlePaymentSuccess(outTradeNo, tradeNo);
    }

    return new NextResponse("success");
  } catch (err) {
    console.error("Alipay notify error:", err);
    return new NextResponse("fail", { status: 500 });
  }
}
