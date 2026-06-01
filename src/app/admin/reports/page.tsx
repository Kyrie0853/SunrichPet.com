import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ReportActions from "@/components/ReportActions";

function timeAgo(d: string) { const diff = Date.now() - new Date(d).getTime(); const m = Math.floor(diff / 60000); if (m < 1) return "刚刚"; if (m < 60) return m + "分钟前"; const h = Math.floor(m / 60); if (h < 24) return h + "小时前"; return Math.floor(h / 24) + "天前"; }

export default async function ReportsAdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "pending" } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const { data: reports } = await supabase.from("reports").select("*").eq("status", tab).order("created_at", { ascending: false }).limit(50);
  if(reports&&reports.length>0){const rIds=[...new Set(reports.map(r=>r.reporter_id))];const{data:rProfiles}=await supabase.from("profiles").select("id,display_name").in("id",rIds);const rMap=new Map((rProfiles||[]).map(p=>[p.id,p]));reports.forEach(r=>r.reporter=rMap.get(r.reporter_id)||null);}

  return (
    <div className="mx-auto max-w-4xl px-0 md:px-4 py-4 md:py-10">
      <h1 className="mb-4 md:mb-6 text-xl md:text-2xl font-bold text-gray-900 px-4 md:px-0">举报管理</h1>
      <div className="mb-4 md:mb-6 flex gap-0 border-b border-gray-200 overflow-x-auto px-4 md:px-0">
        {[{ key: "pending", label: "待处理" }, { key: "resolved", label: "已处理" }, { key: "dismissed", label: "已忽略" }].map(t => (
          <Link key={t.key} href={"/admin/reports?tab=" + t.key}
            className={'shrink-0 px-3 md:px-4 py-2.5 md:py-2.5 text-[13px] md:text-sm font-medium border-b-2 -mb-px transition min-h-[44px] flex items-center ' + (tab === t.key ? "border-red-600 text-red-700" : "border-transparent text-gray-500 hover:text-gray-700")}>
            {t.label}
          </Link>
        ))}
      </div>

      {(!reports || reports.length === 0) ? (
        <div className="py-20 text-center"><p className="text-4xl">📋</p><p className="mt-4 text-gray-400">暂无举报</p></div>
      ) : (
        <div className="space-y-2 md:space-y-3 px-4 md:px-0">
          {reports.map((r: any) => (
            <div key={r.id} className="rounded-xl border border-gray-100 bg-white p-3 md:p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                <div className="flex flex-wrap items-center gap-1.5 text-[13px] md:text-sm">
                  <span className="font-semibold text-gray-900">{r.reporter?.display_name || "匿名"}</span>
                  <span className="text-gray-400">举报了</span>
                  <span className={"rounded-full px-2 py-0.5 text-[11px] md:text-xs font-medium " + (r.target_type === "post" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700")}>
                    {r.target_type === "post" ? "帖子" : "评论"}
                  </span>
                </div>
                <span className="text-[11px] md:text-xs text-gray-400">{timeAgo(r.created_at)}</span>
              </div>
              <p className="mt-1.5 text-[13px] md:text-sm text-gray-600">原因：{r.reason}</p>
              <div className="mt-2 md:mt-3 flex items-center gap-2">
                {r.target_type === "post" ? (
                  <Link href={"/community/post/" + r.target_id} className="text-[12px] md:text-xs text-emerald-600 hover:underline min-h-[44px] flex items-center" target="_blank">查看内容 →</Link>
                ) : (
                  <span className="text-[12px] md:text-xs text-gray-400">评论 ID: {r.target_id?.slice(0, 8)}...</span>
                )}
                {tab === "pending" && <ReportActions reportId={r.id} targetType={r.target_type} targetId={r.target_id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
