import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "缺少订单ID" }, { status: 400 });

    const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    if (order.status !== "pending") return NextResponse.json({ error: "仅待付款订单可确认" }, { status: 400 });

    const now = new Date().toISOString();
    const { error } = await supabase.from("orders").update({
      status: "paid", paid_at: now, payment_method: "wechat",
    }).eq("id", orderId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("order_logs").insert({
      order_id: orderId, action: "paid", operator_id: user.id,
      details: { method: "wechat", confirmedBy: user.email },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
