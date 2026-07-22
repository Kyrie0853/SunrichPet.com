import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function StudioDashboardPage() {
  const supabase = await createClient();
  const { count: productCount } = await supabase.from("studio_products").select("*", { count: "exact", head: true });
  const { data: products } = await supabase.from("studio_products").select("status").order("created_at", { ascending: false }).limit(50);
  const { count: orderCount } = await supabase.from("orders").select("*", { count: "exact", head: true }).neq("status", "cancelled");
  const { data: recentOrders } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5);

  const available = (products || []).filter((p: any) => p.status === "available").length;
  const presale = (products || []).filter((p: any) => p.status === "presale").length;
  const statusLabels: Record<string, string> = { pending: "待付款", paid: "已付款", shipped: "已发货", completed: "已完成", refunding: "退款中", refunded: "已退款", cancelled: "已取消" };
  const statusColors: Record<string, string> = { pending: "bg-yellow-50 text-yellow-700", paid: "bg-blue-50 text-blue-700", shipped: "bg-purple-50 text-purple-700", completed: "bg-emerald-50 text-emerald-700", refunding: "bg-orange-50 text-orange-700", refunded: "bg-red-50 text-red-700", cancelled: "bg-gray-100 text-gray-500" };

  return (
    <div>
      <h1 className="text-lg md:text-xl font-semibold text-[#1f2937] mb-6">工作室仪表盘</h1>
      {/* 快捷发布入口 */}
      <Link href="/studio/dashboard/products/new"
        className="mb-6 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#1a7f5a] to-emerald-500 p-5 text-white hover:from-[#166b4b] hover:to-emerald-600 transition-all shadow-md hover:shadow-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl">+</div>
        <div>
          <p className="text-[16px] font-bold">添加新个体</p>
          <p className="text-[13px] text-white/80">上传图片，填写信息，一键发布在售爬宠</p>
        </div>
        <svg className="ml-auto h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        {[{ label: "总个体数", value: productCount || 0, color: "bg-[#e8f5ef] text-[#1a7f5a]" }, { label: "可发货", value: available, color: "bg-emerald-50 text-emerald-600" }, { label: "预售中", value: presale, color: "bg-orange-50 text-orange-600" }, { label: "总订单", value: orderCount || 0, color: "bg-blue-50 text-blue-600" }].map(stat => (
          <div key={stat.label} className={"rounded-xl p-4 " + stat.color}>
            <p className="text-[12px] opacity-70">{stat.label}</p>
            <p className="text-2xl md:text-3xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-[#1f2937]">最近订单</h2>
            <Link href="/studio/dashboard/orders" className="text-[12px] text-[#1a7f5a] hover:underline">查看全部</Link>
          </div>
          <div className="bg-white rounded-xl border border-[#f3f4f6] overflow-hidden">
            {recentOrders && recentOrders.length > 0 ? (
              <table className="w-full text-[13px]">
                <thead><tr className="border-b bg-[#f9fafb]"><th className="text-left px-3 py-2.5">订单号</th><th className="text-left px-3 py-2.5">金额</th><th className="text-left px-3 py-2.5">状态</th></tr></thead>
                <tbody>{recentOrders.map((o: any) => (
                  <tr key={o.id} className="border-b hover:bg-[#f9fafb]">
                    <td className="px-3 py-2.5 font-mono text-[11px]">{o.id.slice(0, 10)}...</td>
                    <td className="px-3 py-2.5 font-medium">¥{Number(o.total_amount).toFixed(2)}</td>
                    <td className="px-3 py-2.5"><span className={"rounded-full px-2 py-0.5 text-[11px] font-medium " + (statusColors[o.status] || "")}>{statusLabels[o.status] || o.status}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            ) : <p className="py-8 text-center text-[#9ca3af] text-[13px]">暂无订单</p>}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3"><h2 className="text-[15px] font-semibold text-[#1f2937]">快捷操作</h2></div>
          <div className="space-y-2">
            <Link href="/studio/dashboard/products/new" className="block rounded-xl bg-white border border-[#f3f4f6] p-4 hover:border-[#1a7f5a]/30 transition-colors">
              <p className="text-[14px] font-semibold text-[#1f2937]">+ 添加新个体</p>
              <p className="text-[12px] text-[#6b7280] mt-1">上传图片，填写信息，发布在售个体</p>
            </Link>
            <Link href="/studio/dashboard/orders" className="block rounded-xl bg-white border border-[#f3f4f6] p-4 hover:border-[#1a7f5a]/30 transition-colors">
              <p className="text-[14px] font-semibold text-[#1f2937]">📦 处理订单</p>
              <p className="text-[12px] text-[#6b7280] mt-1">查看订单，确认发货</p>
            </Link>
            <Link href="/studio/dashboard/products" className="block rounded-xl bg-white border border-[#f3f4f6] p-4 hover:border-[#1a7f5a]/30 transition-colors">
              <p className="text-[14px] font-semibold text-[#1f2937]">🦎 管理个体</p>
              <p className="text-[12px] text-[#6b7280] mt-1">查看和管理所有在售/预售/已售个体</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
