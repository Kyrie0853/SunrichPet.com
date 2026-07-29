import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { ids } = await req.json();
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "请提供要删除的订单ID列表" }, { status: 400 });
  }

  // 先查询订单状态，筛选出可删除的
  const { data: orders } = await supabase.from("orders").select("id, status").in("id", ids);
  if (!orders || orders.length === 0) {
    return NextResponse.json({ error: "未找到指定订单" }, { status: 404 });
  }

  const deletableIds = orders
    .filter((o: any) => o.status === "pending" || o.status === "cancelled")
    .map((o: any) => o.id);

  const rejected = orders.length - deletableIds.length;

  if (deletableIds.length === 0) {
    return NextResponse.json({ error: "所选订单均不满足删除条件（仅待付款/已取消可删）" }, { status: 400 });
  }

  // 删除关联日志
  await supabase.from("order_logs").delete().in("order_id", deletableIds);
  // 删除订单
  const { error } = await supabase.from("orders").delete().in("id", deletableIds);

  if (error) return NextResponse.json({ error: "删除失败: " + error.message }, { status: 500 });

  return NextResponse.json({ success: true, deleted: deletableIds.length, rejected });
}
