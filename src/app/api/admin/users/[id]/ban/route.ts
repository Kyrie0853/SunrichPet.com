import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import { logAdminAction } from "@/lib/auth/admin-logs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireAdmin();
  const { id } = await params;
  const { banned } = await req.json();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ banned: banned || false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAdminAction({ adminId: userId, action: banned ? "ban_user" : "unban_user", targetType: "user", targetId: id });
  return NextResponse.json({ success: true });
}
