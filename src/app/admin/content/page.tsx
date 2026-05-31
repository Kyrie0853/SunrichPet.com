"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminContentPage() {
  const [tab, setTab] = useState<"posts"|"reports">("posts");
  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("community_posts").select("id,title,author_id,bar_id,created_at,bars:bar_id(name)").order("created_at",{ascending:false}).limit(50);
    setPosts((data||[]).map((p:any)=>({...p,barName:Array.isArray(p.bars)?p.bars[0]?.name:p.bars?.name})));
    setLoading(false);
  }, [supabase]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/reports?status=pending");
    const data = await res.json();
    setReports(data.reports||[]);
    setLoading(false);
  }, []);

  useEffect(() => { tab === "posts" ? loadPosts() : loadReports(); }, [tab, loadPosts, loadReports]);

  async function deletePost(id: string) {
    if (!confirm("确定删除该帖子?")) return;
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    loadPosts();
  }

  async function resolveReport(id: string, action: string) {
    if (!confirm(action==="approve"?"通过举报并删除内容?":"驳回举报?")) return;
    await fetch(`/api/admin/reports/${id}/resolve`, { method: "POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({action}) });
    loadReports();
  }

  const tabs = [{key:"posts",label:"帖子管理"},{key:"reports",label:`举报处理(${reports.length})`}];

  return (
    <div>
      <h1 className="text-xl font-semibold text-[#1f2937] mb-6">内容管理</h1>
      <div className="flex gap-1 mb-4 border-b border-[#f3f4f6]">
        {tabs.map(t=>(<button key={t.key} onClick={()=>setTab(t.key as any)} className={`px-4 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors ${tab===t.key?"border-[#1a7f5a] text-[#1a7f5a]":"border-transparent text-[#6b7280] hover:text-[#1f2937]"}`}>{t.label}</button>))}
      </div>
      {loading ? <p className="py-8 text-center text-[#9ca3af]">加载中...</p> :
       tab==="posts" ? (
        <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-[#f3f4f6] bg-[#f9fafb]"><th className="text-left px-4 py-3">标题</th><th className="text-left px-4 py-3">社区</th><th className="text-left px-4 py-3">时间</th><th className="text-right px-4 py-3">操作</th></tr></thead>
            <tbody>{posts.map(p=>(<tr key={p.id} className="border-b border-[#f3f4f6] hover:bg-[#f9fafb]"><td className="px-4 py-3 font-medium">{p.title?.slice(0,40)}</td><td className="px-4 py-3 text-[#6b7280]">{p.barName||"-"}</td><td className="px-4 py-3 text-[#6b7280]">{new Date(p.created_at).toLocaleDateString("zh-CN")}</td><td className="px-4 py-3 text-right"><button onClick={()=>deletePost(p.id)} className="rounded-full px-3 py-1 text-[11px] text-red-500 hover:bg-red-50">删除</button></td></tr>))}</tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-2">{reports.map((r:any)=>(<div key={r.id} className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] p-4"><div className="flex items-center justify-between"><div><span className="text-[13px] font-medium">{r.reporterName||"匿名"}</span><span className="text-[#9ca3af] mx-2">举报了</span><span className="text-[13px]">{r.target_type}</span><span className="text-[#9ca3af] ml-2 text-[11px]">{new Date(r.created_at).toLocaleString("zh-CN")}</span></div><div className="flex gap-1.5"><button onClick={()=>resolveReport(r.id,"approve")} className="rounded-full px-3 py-1 text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100">通过</button><button onClick={()=>resolveReport(r.id,"dismiss")} className="rounded-full px-3 py-1 text-[11px] bg-gray-100 text-[#6b7280] hover:bg-gray-200">驳回</button></div></div><p className="mt-1 text-[12px] text-[#6b7280]">原因: {r.reason||"未提供"}</p></div>))}</div>
      )}
    </div>
  );
}
