import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  // 兜底：description 列有 NOT NULL 约束，若前端未传（或传 null）则补空字符串
  const payload = { ...body, description: body.description == null ? "" : body.description };
  const { error } = await supabase.from("studio_products").update(payload).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;
  const { error } = await supabase.from("studio_products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
