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

  let query = supabase.from("profiles").select("id,display_name,email,avatar_url,role,created_at,points,banned", { count: "estimated" }).order("created_at", { ascending: false });

  if (q) query = query.ilike("display_name", `%${q}%`);
  if (role) query = query.eq("role", role);

  const { data, count, error } = await query.range((page - 1) * 20, page * 20 - 1);

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
