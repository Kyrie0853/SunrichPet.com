import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/admin";
import { logAdminAction } from "@/lib/auth/admin-logs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireSuperAdmin();
  const { id } = await params;
  const { role } = await req.json();
  if (!["customer", "admin", "super_admin"].includes(role)) {
    return NextResponse.json({ error: "无效角色" }, { status: 400 });
  }
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAdminAction({ adminId: userId, action: "change_role", targetType: "user", targetId: id, details: { newRole: role } });
  return NextResponse.json({ success: true });
}
