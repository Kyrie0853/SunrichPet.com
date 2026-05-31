import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import { logAdminAction } from "@/lib/auth/admin-logs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireAdmin();
  const { id } = await params;
  const { action } = await req.json();
  const supabase = await createClient();
  if (action === "approve") {
    const { data: report } = await supabase.from("reports").select("*").eq("id", id).single();
    if (report) {
      if (report.target_type === "post") await supabase.from("community_posts").delete().eq("id", report.target_id);
      else if (report.target_type === "comment") await supabase.from("community_comments").delete().eq("id", report.target_id);
    }
  }
  await supabase.from("reports").update({ status: action === "approve" ? "resolved" : "dismissed" }).eq("id", id);
  await logAdminAction({ adminId: userId, action: "resolve_report", targetType: "report", targetId: id });
  return NextResponse.json({ success: true });
}
