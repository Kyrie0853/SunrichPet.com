import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAlipayOrder } from "@/lib/studio/alipay";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const body = await req.json();
    const { product_id, buyer_message } = body;
    if (!product_id) return NextResponse.json({ error: "缺少商品ID" }, { status: 400 });

    // 支持新版独立字段 + 旧版合并字段
    const recipientName = body.recipient_name || "";
    const recipientPhone = body.recipient_phone || "";
    const recipientAddress = body.recipient_address || "";
    const paymentMethod = body.payment_method || "alipay";
    const shippingAddress = body.shipping_address
      || [recipientName, recipientPhone, recipientAddress].filter(Boolean).join(" · ");

    const { data: product } = await supabase
      .from("studio_products")
      .select("*")
      .eq("product_id", product_id)
      .eq("status", "available")
      .single();

    if (!product) {
      return NextResponse.json({ error: "商品不存在或已售出" }, { status: 400 });
    }

    const { data: order, error: orderErr } = await supabase.from("orders").insert({
      user_id: user.id,
      product_id: product.product_id,
      product_name: product.name,
      status: "pending",
      total_amount: product.price,
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
    }).select("id").single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "创建订单失败" }, { status: 500 });
    }

    await supabase.from("order_logs").insert({
      order_id: order.id,
      action: "created",
      operator_id: user.id,
      details: {
        productId: product_id,
        amount: product.price,
        method: "alipay",
        recipient: { name: recipientName, phone: recipientPhone, address: recipientAddress },
      },
    });

    // ═══════════════════════════════════════════
    // 支付宝支付：生成支付页面 URL
    // ═══════════════════════════════════════════
    let payUrl: string | null = null;
    let alipayError: string | null = null;
    if (paymentMethod === "alipay") {
      console.log("[Order Create] 支付方式: 支付宝担保交易");
      console.log("[Order Create] 开始生成支付宝支付URL...");
      try {
        payUrl = await createAlipayOrder({
          orderId: order.id,
          productName: product.name,
          totalAmount: product.price,
          buyerMessage: buyer_message || "",
        });
        console.log("[Order Create] ✅ 支付宝支付URL生成成功");
        console.log("[Order Create] payUrl长度:", payUrl?.length || 0);
      } catch (e: any) {
        console.error("[Order Create] ❌ 支付宝订单创建失败:", e.message);
        console.error("[Order Create] 错误堆栈:", e.stack);
        alipayError = e.message || "支付宝支付配置错误";
        // 订单已创建但支付URL生成失败 — 返回错误给前端展示
      }
    } else {
      console.log("[Order Create] 支付方式: 微信转账（将显示收款码）");
    }

    if (alipayError) {
      console.log("[Order Create] ⚠️ 订单已创建但支付URL生成失败:", alipayError);
      return NextResponse.json({
        success: true,
        orderId: order.id,
        payUrl: null,
        warning: "订单已创建，但支付宝支付通道暂时不可用：" + alipayError,
      });
    }

    console.log("[Order Create] ✅ 订单创建完成, orderId:", order.id);

    return NextResponse.json({ success: true, orderId: order.id, payUrl });
  } catch (err: any) {
    console.error("[Order Create] ❌ 创建订单失败:", err.message);
    console.error("[Order Create] 错误堆栈:", err.stack);
    return NextResponse.json({ error: "创建订单失败" }, { status: 500 });
  }
}
