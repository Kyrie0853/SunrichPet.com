import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

export async function GET() {
  await requireAdmin();
  const supabase = await createClient();

  const [users, posts, orders, reports] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("community_posts").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const { data: logs } = await supabase.from("admin_logs").select("*, profiles:admin_id(display_name)").order("created_at", { ascending: false }).limit(10);

  return NextResponse.json({
    userCount: users.count || 0,
    postCount: posts.count || 0,
    orderCount: orders.count || 0,
    pendingReports: reports.count || 0,
    recentLogs: (logs || []).map((l: any) => ({
      ...l,
      adminName: Array.isArray(l.profiles) ? l.profiles[0]?.display_name : l.profiles?.display_name,
    })),
  });
}
