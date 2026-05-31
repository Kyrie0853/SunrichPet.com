import { createClient } from "@/lib/supabase/server";

type LogAction = {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, any>;
};

/**
 * 记录管理员操作日志
 */
export async function logAdminAction(params: LogAction) {
  const supabase = await createClient();
  const { error } = await supabase.from("admin_logs").insert({
    admin_id: params.adminId,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId || null,
    details: params.details || {},
  });
  if (error) {
    console.error("logAdminAction error:", error);
  }
}
