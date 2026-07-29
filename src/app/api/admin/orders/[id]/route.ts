import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/admin/orders/[id]
 * 管理员删除订单 — 仅允许删除"待付款"或"已取消"的订单
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  // 权限校验
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;

  // 检查订单状态
  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  if (order.status !== "pending" && order.status !== "cancelled") {
    return NextResponse.json(
      { error: "仅待付款或已取消的订单可删除" },
      { status: 400 }
    );
  }

  // 删除关联日志
  await supabase.from("order_logs").delete().eq("order_id", id);

  // 删除订单
  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "删除失败: " + error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
