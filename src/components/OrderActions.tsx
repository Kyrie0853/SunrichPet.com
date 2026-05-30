"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function OrderActions({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const supabase = createClient();
  async function updateStatus(s: string) { await supabase.from("orders").update({ status: s }).eq("id", orderId); router.refresh(); }
  return (<div className="flex gap-1">
    {currentStatus === "paid" && <button onClick={() => updateStatus("shipped")} className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white">发货</button>}
    {currentStatus === "shipped" && <button onClick={() => updateStatus("completed")} className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">完成</button>}
    <button onClick={() => updateStatus("cancelled")} className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600">取消</button>
  </div>);
}
