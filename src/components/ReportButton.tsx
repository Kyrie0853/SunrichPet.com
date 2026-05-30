"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const REASONS = ["广告", "色情", "暴力", "辱骂", "虚假信息", "其他"];

export default function ReportButton({ targetType, targetId }: { targetType: "post" | "comment"; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [custom, setCustom] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function submitReport() {
    const r = reason === "其他" ? custom.trim() : reason;
    if (!r) { setError("请选择或填写举报原因"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("请先登录"); return; }
    const { error: insErr } = await supabase.from("reports").insert({
      reporter_id: user.id, target_type: targetType, target_id: targetId, reason: r
    });
    if (insErr) { setError("提交失败"); return; }
    // 检查是否达到自动隐藏阈值
    const { count } = await supabase.from("reports").select("*", { count: "exact", head: true }).eq("target_type", targetType).eq("target_id", targetId).eq("status", "pending");
    if ((count || 0) >= 5) {
      if (targetType === "post") {
        await supabase.from("community_posts").update({ status: "inactive" }).eq("id", targetId);
      } else {
        await supabase.from("community_comments").delete().eq("id", targetId);
      }
    }
    setSubmitted(true);
  }

  if (submitted) return <span className="text-xs text-gray-400">已举报</span>;

  return (
    <span className="relative">
      <button onClick={() => setOpen(!open)} className="text-xs text-gray-400 hover:text-red-500" title="举报">
        <svg className="inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-6 left-0 z-50 w-52 rounded-xl border border-gray-100 bg-white p-4 shadow-lg">
          <p className="mb-2 text-xs font-semibold text-gray-700">举报{targetType === "post" ? "帖子" : "评论"}</p>
          <div className="space-y-1">
            {REASONS.map(r => (
              <button key={r} onClick={() => { setReason(r); setCustom(""); }}
                className={"block w-full rounded-lg px-2 py-1.5 text-left text-xs transition " + (reason === r ? "bg-red-50 text-red-700" : "text-gray-600 hover:bg-gray-50")}>
                {r}
              </button>
            ))}
          </div>
          {reason === "其他" && (
            <input type="text" value={custom} onChange={e => setCustom(e.target.value)} placeholder="请描述..."
              className="mt-2 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-red-400" />
          )}
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button onClick={submitReport} className="flex-1 rounded-lg bg-red-600 py-1.5 text-xs font-semibold text-white hover:bg-red-700">提交</button>
            <button onClick={() => setOpen(false)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50">取消</button>
          </div>
        </div>
      )}
    </span>
  );
}
