"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// ---- 确认弹窗 ----
function ConfirmModal({ message, confirmLabel, confirmClass, onConfirm, onCancel }: {
  message: string; confirmLabel: string; confirmClass: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[90%] sm:max-w-sm p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <p className="text-[14px] text-[#1f2937] mb-5 text-center">{message}</p>
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <button onClick={onCancel} className="flex-1 rounded-full border border-[#e5e7eb] py-2.5 text-[13px] text-[#6b7280] hover:bg-[#f9fafb] min-h-[44px]">取消</button>
          <button onClick={onConfirm} className={"flex-1 rounded-full py-2.5 text-[13px] font-medium text-white min-h-[44px] " + confirmClass}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminContentPage() {
  const [tab, setTab] = useState<"posts"|"reports">("posts");
  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<{ message: string; label: string; cls: string; action: () => void } | null>(null);
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
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    loadPosts();
  }

  async function resolveReport(id: string, action: string) {
    await fetch(`/api/admin/reports/${id}/resolve`, { method: "POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({action}) });
    loadReports();
  }

  const tabs = [
    { key: "posts" as const, label: "帖子管理" },
    { key: "reports" as const, label: "举报处理" },
  ];

  return (
    <div>
      <h1 className="text-lg md:text-xl font-semibold text-[#1f2937] mb-4 md:mb-6">内容管理</h1>

      {/* ---- Tab 切换 ---- */}
      <div className="flex mb-4 border-b border-[#f3f4f6]">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={"flex-1 md:flex-none px-4 py-3 text-[14px] md:text-[13px] font-medium border-b-2 -mb-px transition-colors min-h-[44px] flex items-center justify-center " +
              (tab === t.key ? "border-[#1a7f5a] text-[#1a7f5a]" : "border-transparent text-[#6b7280] hover:text-[#1f2937]")}>
            {t.label}{t.key === "reports" && reports.length > 0 && <span className="ml-1.5 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">{reports.length}</span>}
          </button>
        ))}
      </div>

      {/* ---- 加载 ---- */}
      {loading && <div className="text-center py-12 text-[#9ca3af] text-[14px]">加载中...</div>}

      {/* ================================================================ */}
      {/*  帖子管理 Tab                                                    */}
      {/* ================================================================ */}
      {!loading && tab === "posts" && (
        <>
          {/* ---- 移动端卡片 (< 768px) ---- */}
          <div className="md:hidden space-y-2.5">
            {posts.length === 0 ? (
              <div className="text-center py-16 text-[#9ca3af]"><p className="text-4xl mb-2">📝</p><p className="text-[14px]">暂无帖子</p></div>
            ) : (
              posts.map((p: any) => (
                <div key={p.id} className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] p-4">
                  {/* 标题 */}
                  <h3 className="font-semibold text-[#1f2937] text-[14px] line-clamp-2 leading-snug">{p.title || "无标题"}</h3>
                  {/* 社区 + 时间 */}
                  <div className="flex items-center gap-2 mt-1.5 text-[12px] text-[#9ca3af]">
                    {p.barName && <span className="bg-[#e8f5ef] text-[#1a7f5a] rounded-full px-2 py-0.5 text-[11px]">{p.barName}</span>}
                    <span>{new Date(p.created_at).toLocaleDateString("zh-CN")}</span>
                  </div>
                  {/* 删除按钮 */}
                  <div className="mt-3 pt-3 border-t border-[#f3f4f6]">
                    <button
                      onClick={() => setConfirm({ message: "确定删除该帖子？此操作不可撤销。", label: "确认删除", cls: "bg-red-500 hover:bg-red-600", action: () => { deletePost(p.id); setConfirm(null); } })}
                      className="rounded-full px-4 py-2 text-[13px] font-medium text-red-500 bg-red-50 hover:bg-red-100 min-w-[44px] min-h-[44px] flex items-center justify-center w-full"
                    >
                      删除帖子
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ---- 桌面端表格 (≥768px) ---- */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-[#f3f4f6] overflow-hidden">
            <div className="table-responsive">
              <table className="w-full text-[13px]">
                <thead><tr className="border-b border-[#f3f4f6] bg-[#f9fafb]"><th className="text-left px-4 py-3 font-medium text-[#6b7280]">标题</th><th className="text-left px-4 py-3 font-medium text-[#6b7280]">社区</th><th className="text-left px-4 py-3 font-medium text-[#6b7280]">时间</th><th className="text-right px-4 py-3 font-medium text-[#6b7280]">操作</th></tr></thead>
                <tbody>
                  {posts.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-12 text-[#9ca3af]">暂无帖子</td></tr>
                  ) : (
                    posts.map((p: any) => (
                      <tr key={p.id} className="border-b border-[#f3f4f6] hover:bg-[#f9fafb]">
                        <td className="px-4 py-3 font-medium max-w-[300px] truncate">{p.title?.slice(0, 50)}</td>
                        <td className="px-4 py-3 text-[#6b7280]">{p.barName || "-"}</td>
                        <td className="px-4 py-3 text-[#6b7280]">{new Date(p.created_at).toLocaleDateString("zh-CN")}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setConfirm({ message: "确定删除该帖子？", label: "确认删除", cls: "bg-red-500 hover:bg-red-600", action: () => { deletePost(p.id); setConfirm(null); } })}
                            className="rounded-full px-3 py-1 text-[11px] text-red-500 hover:bg-red-50">删除</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ================================================================ */}
      {/*  举报处理 Tab                                                    */}
      {/* ================================================================ */}
      {!loading && tab === "reports" && (
        <div className="space-y-2.5">
          {reports.length === 0 ? (
            <div className="text-center py-16 text-[#9ca3af]"><p className="text-4xl mb-2">📋</p><p className="text-[14px]">暂无待处理举报</p></div>
          ) : (
            reports.map((r: any) => (
              <div key={r.id} className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] p-4">
                {/* 举报者信息 */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                  <span className="font-semibold text-[#1f2937]">{r.reporterName || "匿名"}</span>
                  <span className="text-[#9ca3af]">举报了</span>
                  <span className="bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 text-[11px] font-medium">{r.target_type === "post" ? "帖子" : "评论"}</span>
                </div>
                {/* 原因 */}
                <p className="mt-1.5 text-[13px] text-[#6b7280]">原因：{r.reason || "未提供"}</p>
                {/* 时间 */}
                <p className="text-[11px] text-[#d1d5db] mt-0.5">{new Date(r.created_at).toLocaleString("zh-CN")}</p>
                {/* 操作按钮 */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-[#f3f4f6]">
                  <button
                    onClick={() => setConfirm({ message: "通过举报并删除该内容？", label: "确认通过", cls: "bg-emerald-500 hover:bg-emerald-600", action: () => { resolveReport(r.id, "approve"); setConfirm(null); } })}
                    className="flex-1 rounded-full bg-emerald-50 py-2.5 text-[13px] font-medium text-emerald-700 hover:bg-emerald-100 min-h-[44px] flex items-center justify-center"
                  >
                    通过
                  </button>
                  <button
                    onClick={() => setConfirm({ message: "确定驳回该举报？", label: "确认驳回", cls: "bg-gray-500 hover:bg-gray-600", action: () => { resolveReport(r.id, "dismiss"); setConfirm(null); } })}
                    className="flex-1 rounded-full bg-gray-100 py-2.5 text-[13px] font-medium text-[#6b7280] hover:bg-gray-200 min-h-[44px] flex items-center justify-center"
                  >
                    驳回
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ---- 确认弹窗 ---- */}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          confirmLabel={confirm.label}
          confirmClass={confirm.cls}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
