import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 轻量化下单 API — 无需登录即可下单
 * 买家提交收货信息 → 系统创建订单（状态：pending）
 * 买家通过微信扫码支付 → 管理员确认收款后发货
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 尝试获取当前用户（可能为 null，买家无需登录）
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { product_id } = body;
    if (!product_id) return NextResponse.json({ error: "缺少商品ID" }, { status: 400 });

    // 收货信息
    const recipientName = body.recipient_name || "";
    const recipientPhone = body.recipient_phone || "";
    const recipientAddress = body.recipient_address || "";
    const paymentMethod = body.payment_method || "wechat";
    const shippingAddress = [recipientName, recipientPhone, recipientAddress].filter(Boolean).join(" · ");

    // 查询商品
    const { data: product } = await supabase
      .from("studio_products")
      .select("*")
      .eq("product_id", product_id)
      .eq("status", "available")
      .single();

    if (!product) {
      return NextResponse.json({ error: "商品不存在或已售出" }, { status: 400 });
    }

    // 创建订单 — user_id 可为空（匿名买家）
    const orderPayload: Record<string, unknown> = {
      product_id: product.product_id,
      product_name: product.name,
      status: "pending",
      total_amount: product.price,
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
    };

    // 如果已登录，关联用户 ID
    if (user) {
      orderPayload.user_id = user.id;
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("id")
      .single();

    if (orderErr || !order) {
      console.error("[Order Create] 创建订单失败:", orderErr);
      return NextResponse.json({ error: "创建订单失败" }, { status: 500 });
    }

    // 记录订单日志
    await supabase.from("order_logs").insert({
      order_id: order.id,
      action: "created",
      operator_id: user?.id || null,
      details: {
        productId: product_id,
        amount: product.price,
        method: paymentMethod,
        recipient: { name: recipientName, phone: recipientPhone, address: recipientAddress },
      },
    });

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err: any) {
    console.error("[Order Create] 创建订单失败:", err.message);
    return NextResponse.json({ error: "创建订单失败" }, { status: 500 });
  }
}
