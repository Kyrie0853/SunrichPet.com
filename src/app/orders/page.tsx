import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "待支付", color: "bg-yellow-50 text-yellow-700" },
  paid: { label: "已支付", color: "bg-blue-50 text-blue-700" },
  shipped: { label: "已发货", color: "bg-purple-50 text-purple-700" },
  completed: { label: "已完成", color: "bg-emerald-50 text-emerald-700" },
  refunding: { label: "退款中", color: "bg-orange-50 text-orange-700" },
  refunded: { label: "已退款", color: "bg-red-50 text-red-700" },
  cancelled: { label: "已取消", color: "bg-gray-100 text-gray-500" },
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-xl md:text-2xl font-bold text-[#1f2937]">我的订单</h1>

      {!orders || orders.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-[#9ca3af] mb-4">暂无订单</p>
          <Link href="/shop" className="inline-block rounded-full bg-[#1a7f5a] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#166b4b]">去逛逛</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => {
            const st = STATUS_MAP[order.status] || { label: order.status, color: "bg-gray-100" };
            return (
              <Link key={order.id} href={"/orders/" + order.id}
                className="block bg-white rounded-xl shadow-sm border border-[#f3f4f6] p-4 hover:border-[#1a7f5a]/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[13px] text-[#6b7280]">订单号：{order.id.slice(0, 12)}...</p>
                    <p className="text-[22px] font-bold text-[#1f2937] mt-1">¥{Number(order.total_amount).toFixed(2)}</p>
                    <p className="text-[12px] text-[#9ca3af] mt-0.5">{new Date(order.created_at).toLocaleString("zh-CN")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={"inline-block rounded-full px-2.5 py-1 text-[12px] font-medium " + st.color}>{st.label}</span>
                    {order.status === 'shipped' && (
                      <p className="text-[11px] text-[#1a7f5a] mt-1">待确认收货</p>
                    )}
                    {order.status === 'pending' && (
                      <p className="text-[11px] text-[#f0a04b] mt-1">待确认收款</p>
                    )}
                    {order.status === 'paid' && (
                      <p className="text-[11px] text-[#6b7280] mt-1">等待发货</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
