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

    let payUrl: string | null = null;
    if (paymentMethod === "alipay") {
      try {
        payUrl = await createAlipayOrder({
          orderId: order.id,
          productName: product.name,
          totalAmount: product.price,
          buyerMessage: buyer_message || "",
        });
      } catch (e) {
        console.error("Alipay order creation failed:", e);
      }
    }

    return NextResponse.json({ success: true, orderId: order.id, payUrl });
  } catch (err: any) {
    console.error("Create order error:", err);
    return NextResponse.json({ error: "创建订单失败" }, { status: 500 });
  }
}
