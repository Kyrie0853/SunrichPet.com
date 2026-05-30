"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ReportActions({ reportId, targetType, targetId }: { reportId: string; targetType: string; targetId: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function resolve(block: boolean) {
    if (block) {
      if (targetType === "post") {
        await supabase.from("community_posts").delete().eq("id", targetId);
      } else {
        await supabase.from("community_comments").delete().eq("id", targetId);
      }
    }
    await supabase.from("reports").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", reportId);
    router.refresh();
  }

  async function dismiss() {
    await supabase.from("reports").update({ status: "dismissed", resolved_at: new Date().toISOString() }).eq("id", reportId);
    router.refresh();
  }

  return (
    <div className="ml-auto flex gap-2">
      <button onClick={() => resolve(true)} className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700">屏蔽并删除</button>
      <button onClick={() => resolve(false)} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700">标记已处理</button>
      <button onClick={dismiss} className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50">忽略</button>
    </div>
  );
}
