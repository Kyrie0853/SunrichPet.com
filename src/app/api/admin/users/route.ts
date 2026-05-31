import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

export async function GET(req: NextRequest) {
  await requireAdmin();
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const role = searchParams.get("role") || "";
  const page = parseInt(searchParams.get("page") || "1");

  let query = supabase.from("profiles").select("id,display_name,email,avatar_url,role,created_at,points", { count: "estimated" }).order("created_at", { ascending: false });

  if (q) query = query.ilike("display_name", `%${q}%`);
  if (role) query = query.eq("role", role);

  const { data, count, error } = await query.range((page - 1) * 20, page * 20 - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 获取 auth.users 的 email
  const userIds = (data || []).map(u => u.id);
  let emailMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    (authUsers?.users || []).forEach((au: any) => {
      if (userIds.includes(au.id)) emailMap.set(au.id, au.email || "");
    });
  }

  return NextResponse.json({
    users: (data || []).map(u => ({ ...u, email: u.email || emailMap.get(u.id) || "" })),
    total: count || 0,
  });
}
