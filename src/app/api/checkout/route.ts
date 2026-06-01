import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================================
// 手动确认收款模式 — 用户提交订单 → 管理员确认收款 → 担保交易
// Stripe 代码保留在下方注释中，方便以后恢复线上支付
// ============================================================

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const { items, shippingAddress } = await req.json();
    if (!items?.length) return NextResponse.json({ error: "购物车为空" }, { status: 400 });

    // 服务端重新计算金额（不信任前端）
    const productIds = items.map((i: any) => i.product_id);
    const { data: products } = await supabase.from("products").select("id,name,price,stock,seller_id").in("id", productIds);
    const priceMap = new Map((products || []).map(p => [p.id, p]));

    let totalAmount = 0;
    for (const item of items) {
      const product = priceMap.get(item.product_id);
      if (!product) continue;
      const qty = Math.max(1, Math.min(item.quantity || 1, product.stock || 99));
      totalAmount += product.price * qty;
    }
    if (totalAmount <= 0) return NextResponse.json({ error: "无有效商品" }, { status: 400 });

    // 获取卖家ID
    const firstProduct = products?.[0];
    const sellerId = firstProduct?.seller_id || null;

    // 创建订单 — 状态 pending（等待管理员确认收款）
    const { data: order, error: orderErr } = await supabase.from("orders").insert({
      user_id: user.id,
      seller_id: sellerId,
      status: "pending",
      total_amount: totalAmount,
      shipping_address: shippingAddress || "",
      payment_method: "manual",
    }).select("id").single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "创建订单失败" }, { status: 500 });
    }

    // 记录日志
    await supabase.from("order_logs").insert({
      order_id: order.id,
      action: "created",
      operator_id: user.id,
      details: { totalAmount, paymentMethod: "manual" },
    });

    // 清空购物车
    const { data: cart } = await supabase.from("carts").select("id").eq("user_id", user.id).single();
    if (cart) {
      await supabase.from("cart_items").delete().eq("cart_id", cart.id);
    }

    // 扣减库存
    for (const item of items) {
      const product = priceMap.get(item.product_id);
      if (product && product.stock > 0) {
        const qty = Math.min(item.quantity || 1, product.stock);
        await supabase.from("products").update({ stock: product.stock - qty }).eq("id", product.id);
      }
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "创建订单失败" }, { status: 500 });
  }
}

/* ============================================================
   Stripe 线上支付代码（保留备用）
   ============================================================
export async function POST_STRIPE(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "支付服务未配置" }, { status: 500 });
  }
  const { stripe } = await import("@/lib/stripe/server");
  // ... 原有 Stripe Checkout Session 逻辑
}
============================================================ */
