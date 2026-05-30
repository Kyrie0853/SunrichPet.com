import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "待支付", color: "bg-yellow-100 text-yellow-700" },
  paid: { label: "已支付", color: "bg-blue-100 text-blue-700" },
  shipped: { label: "已发货", color: "bg-purple-100 text-purple-700" },
  completed: { label: "已完成", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "已取消", color: "bg-gray-100 text-gray-500" },
};

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles:user_id(display_name, email)")
    .order("created_at", { ascending: false })
    .limit(50);

  const normalized = (orders || []).map((order: any) => ({
    ...order,
    profile: Array.isArray(order.profiles) ? order.profiles[0] : order.profiles,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/admin" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-700">
        &larr; 返回后台
      </Link>
      <h1 className="mb-2 text-2xl font-bold text-gray-800">订单管理</h1>
      <p className="mb-8 text-sm text-gray-400">共 {normalized.length} 条订单</p>

      {normalized.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl">📦</p>
          <p className="mt-4 text-gray-400">暂无订单</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">订单号</th>
                <th className="px-4 py-3 font-medium text-gray-500">用户</th>
                <th className="px-4 py-3 font-medium text-gray-500">金额</th>
                <th className="px-4 py-3 font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 font-medium text-gray-500">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {normalized.map((order: any) => {
                const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {order.profile?.display_name || order.profile?.email || "用户"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">
                      ¥{order.total_amount}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(order.created_at).toLocaleString("zh-CN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
