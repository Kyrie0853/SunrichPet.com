import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import { logAdminAction } from "@/lib/auth/admin-logs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireAdmin();
  const { id } = await params;
  const { status } = await req.json();
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAdminAction({ adminId: userId, action: status === "active" ? "activate_product" : "deactivate_product", targetType: "product", targetId: id });
  return NextResponse.json({ success: true });
}
