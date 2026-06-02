import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST: Appoint a bar admin (owner or super_admin only)
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check permission
  const { data: bar } = await supabase.from("bars").select("id,owner_id").eq("slug", slug).single();
  if (!bar) return NextResponse.json({ error: "Bar not found" }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isSuperAdmin = profile?.role === "admin" || profile?.role === "super_admin";
  if (bar.owner_id !== user.id && !isSuperAdmin) {
    return NextResponse.json({ error: "Only bar owner or super admin can appoint admins" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const { error } = await supabase.from("bar_admins").insert({
    bar_id: bar.id, user_id: userId, appointed_by: user.id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}

// DELETE: Remove a bar admin
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: bar } = await supabase.from("bars").select("id,owner_id").eq("slug", slug).single();
  if (!bar) return NextResponse.json({ error: "Bar not found" }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isSuperAdmin = profile?.role === "admin" || profile?.role === "super_admin";
  if (bar.owner_id !== user.id && !isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const targetUserId = url.searchParams.get("userId");
  if (!targetUserId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const { error } = await supabase.from("bar_admins").delete().eq("bar_id", bar.id).eq("user_id", targetUserId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
