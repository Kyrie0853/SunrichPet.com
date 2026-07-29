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
    return NextResponse.json({ error: "请提供要删除的商品ID列表" }, { status: 400 });
  }

  const { error } = await supabase.from("studio_products").delete().in("id", ids);
  if (error) return NextResponse.json({ error: "删除失败: " + error.message }, { status: 500 });

  return NextResponse.json({ success: true, deleted: ids.length });
}
