import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

export async function GET(req: NextRequest) {
  await requireAdmin();
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";
  const { data, count } = await supabase.from("reports").select("*, reporter:reporter_id(display_name)", { count: "estimated" }).eq("status", status).order("created_at", { ascending: false }).limit(50);
  return NextResponse.json({
    reports: (data || []).map((r: any) => ({ ...r, reporterName: Array.isArray(r.reporter) ? r.reporter[0]?.display_name : r.reporter?.display_name })),
    total: count || 0,
  });
}
