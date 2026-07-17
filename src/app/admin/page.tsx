import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminDashboard() {
  const { userId } = await requireAdmin();
  const supabase = await createClient();

  // 基础统计
  const [users, products, orders] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("studio_products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "用户总数", value: users.count || 0, icon: "👥", color: "bg-blue-50 text-blue-700" },
    { label: "商品总数", value: products.count || 0, icon: "🦎", color: "bg-emerald-50 text-emerald-700" },
    { label: "订单总数", value: orders.count || 0, icon: "📦", color: "bg-amber-50 text-amber-700" },
  ];

  // 最近日志
  const { data: logs } = await supabase.from("admin_logs").select("*").order("created_at", { ascending: false }).limit(10);

  return (
    <div>
      <h1 className="text-xl font-semibold text-[#1f2937] mb-6">仪表盘</h1>

      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 md:p-5 shadow-sm border border-[#f3f4f6]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-0">
              <span className="text-xl md:text-2xl">{s.icon}</span>
              <span className="text-xl md:text-2xl font-bold text-[#1f2937]">{s.value}</span>
            </div>
            <p className="mt-1.5 md:mt-2 text-[11px] md:text-[13px] text-[#6b7280]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] p-5">
        <h2 className="text-[15px] font-semibold text-[#1f2937] mb-4">最近操作日志</h2>
        {!logs || logs.length === 0 ? (
          <p className="text-[13px] text-[#9ca3af] py-4 text-center">暂无日志</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 text-[13px] py-2 border-b border-[#f3f4f6] last:border-0">
                <span className="text-[#9ca3af] w-24 shrink-0">{new Date(log.created_at).toLocaleString("zh-CN")}</span>
                <span className="font-medium text-[#1f2937]">{log.action}</span>
                <span className="text-[#9ca3af]">{log.target_type}#{log.target_id?.slice(0, 8)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
