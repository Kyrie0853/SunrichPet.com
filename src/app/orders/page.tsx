import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-800">我的订单</h1>

      {!orders || orders.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg text-gray-400">暂无订单</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-emerald-600 hover:underline"
          >
            去逛逛
          </Link>
        </div>
      ) : (
        <ul className="divide-y">
          {orders.map((order) => (
            <li key={order.id} className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    订单号：{order.id.slice(0, 8)}...
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleString("zh-CN")}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      order.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : order.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {order.status === "pending"
                      ? "待处理"
                      : order.status === "confirmed"
                        ? "已确认"
                        : "已取消"}
                  </span>
                  <p className="mt-1 font-semibold text-emerald-600">
                    ¥{order.total_amount}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
