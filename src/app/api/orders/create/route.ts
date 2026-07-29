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
    const { product_id, items } = body;

    // 支持购物车多商品结算
    if (items && Array.isArray(items) && items.length > 0) {
      // 多商品订单
      const totalAmount = items.reduce(
        (sum: number, item: any) => sum + (Number(item.price) || 0) * (item.quantity || 1),
        0
      );
      const productNames = items.map((item: any) => item.name).join(" · ");

      const shippingAddress = [
        body.recipient_name || "",
        body.recipient_phone || "",
        body.recipient_address || "",
      ].filter(Boolean).join(" · ");

      const orderPayload: Record<string, unknown> = {
        product_id: items[0].product_id,
        product_name: productNames,
        status: "pending",
        total_amount: totalAmount,
        shipping_address: shippingAddress,
        payment_method: "wechat",
      };
      if (user) orderPayload.user_id = user.id;

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select("id")
        .single();

      if (orderErr || !order) {
        console.error("[Order Create] 创建多商品订单失败:", orderErr);
        return NextResponse.json({ error: "创建订单失败" }, { status: 500 });
      }

      await supabase.from("order_logs").insert({
        order_id: order.id,
        action: "created",
        operator_id: user?.id || null,
        details: {
          items: items.map((item: any) => ({
            productId: item.product_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1,
          })),
          totalAmount,
          method: "wechat",
          recipient: { name: body.recipient_name, phone: body.recipient_phone, address: body.recipient_address },
        },
      });

      return NextResponse.json({ success: true, orderId: order.id });
    }

    // ===== 原有单品下单逻辑 =====
    if (!product_id) return NextResponse.json({ error: "缺少商品ID" }, { status: 400 });

    const recipientName = body.recipient_name || "";
    const recipientPhone = body.recipient_phone || "";
    const recipientAddress = body.recipient_address || "";
    const paymentMethod = body.payment_method || "wechat";
    const shippingAddress = [recipientName, recipientPhone, recipientAddress].filter(Boolean).join(" · ");

    const { data: product } = await supabase
      .from("studio_products")
      .select("*")
      .eq("product_id", product_id)
      .eq("status", "available")
      .single();

    if (!product) {
      return NextResponse.json({ error: "商品不存在或已售出" }, { status: 400 });
    }

    const orderPayload: Record<string, unknown> = {
      product_id: product.product_id,
      product_name: product.name,
      status: "pending",
      total_amount: product.price,
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
    };
    if (user) orderPayload.user_id = user.id;

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("id")
      .single();

    if (orderErr || !order) {
      console.error("[Order Create] 创建订单失败:", orderErr);
      return NextResponse.json({ error: "创建订单失败" }, { status: 500 });
    }

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
