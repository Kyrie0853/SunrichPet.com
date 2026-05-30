import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "支付服务未配置" }, { status: 500 });
  }
  const { stripe } = await import("@/lib/stripe/server");
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const { items, shippingAddress } = await req.json();
    if (!items?.length) return NextResponse.json({ error: "购物车为空" }, { status: 400 });

    const productIds = items.map((i: any) => i.product_id);
    const { data: products } = await supabase.from("products").select("id,name,price,stock").in("id", productIds);
    const priceMap = new Map((products || []).map(p => [p.id, p]));

    let totalAmount = 0;
    const lineItems: any[] = [];
    for (const item of items) {
      const product = priceMap.get(item.product_id);
      if (!product) continue;
      const qty = Math.max(1, Math.min(item.quantity || 1, product.stock || 99));
      totalAmount += product.price * qty;
      lineItems.push({
        price_data: { currency: "cny", product_data: { name: product.name }, unit_amount: Math.round(product.price * 100) },
        quantity: qty,
      });
    }
    if (lineItems.length === 0) return NextResponse.json({ error: "无有效商品" }, { status: 400 });

    const { data: order } = await supabase.from("orders").insert({
      user_id: user.id, status: "pending", total_amount: totalAmount, shipping_address: shippingAddress || "",
    }).select("id").single();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "alipay", "wechat_pay"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/orders?success=true`,
      cancel_url: `${req.headers.get("origin")}/cart?canceled=true`,
      metadata: { order_id: order?.id || "" },
    } as any);

    if (order) await supabase.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "创建支付失败" }, { status: 500 });
  }
}
