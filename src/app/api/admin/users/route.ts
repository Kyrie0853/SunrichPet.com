import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

export async function GET(req: NextRequest) {
  await requireAdmin();
  const supabase = await createClient();

  // Verify the user is actually recognized
  const { data: { user } } = await supabase.auth.getUser();
  console.log("[admin/users] Request by:", user?.id, user?.email);

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const role = searchParams.get("role") || "";
  const page = parseInt(searchParams.get("page") || "1");

  // 先尝试含 email 的查询（需执行 docs/fix-profiles-email.sql），失败则回退
  let data: any[] | null = null;
  let count: number | null = null;
  let error: any = null;

  // 尝试1: 包含 email
  try {
    const query1 = supabase.from("profiles").select("id,display_name,email,avatar_url,role,created_at,points,banned", { count: "estimated" }).order("created_at", { ascending: false });
    if (q) query1.ilike("display_name", `%${q}%`);
    if (role) query1.eq("role", role);
    const r1 = await query1.range((page - 1) * 20, page * 20 - 1);
    if (!r1.error) {
      data = r1.data;
      count = r1.count;
    } else {
      error = r1.error;
    }
  } catch { /* 回退 */ }

  // 尝试2: 不含 email（兼容未执行 fix-profiles-email.sql 的情况）
  if (!data && error) {
    console.warn("[admin/users] 含email查询失败，回退不含email:", error.message);
    const query2 = supabase.from("profiles").select("id,display_name,role,created_at", { count: "estimated" }).order("created_at", { ascending: false });
    if (q) query2.ilike("display_name", `%${q}%`);
    if (role) query2.eq("role", role);
    const r2 = await query2.range((page - 1) * 20, page * 20 - 1);
    data = r2.data;
    count = r2.count;
    error = r2.error;
  }

  console.log("[admin/users] Query result:", { count, dataLength: data?.length, error: error?.message });

  if (error) {
    console.error("[admin/users] Query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    users: (data || []),
    total: count || 0,
  });
}
