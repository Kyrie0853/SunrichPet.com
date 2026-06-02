"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AdminBarsPage() {
  const supabase = createClient();
  const [bars, setBars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedBar, setSelectedBar] = useState<string | null>(null);

  const loadBars = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("bars").select("*, owner:owner_id(id,display_name)").order("member_count", { ascending: false });
    // Load admins for each bar
    if (data) {
      const barIds = data.map((b: any) => b.id);
      const { data: allAdmins } = await supabase.from("bar_admins").select("bar_id,user_id").in("bar_id", barIds);
      const adminUserIds = [...new Set((allAdmins || []).map((a: any) => a.user_id))];
      const { data: adminProfiles } = await supabase.from("profiles").select("id,display_name").in("id", adminUserIds);
      const pMap = new Map((adminProfiles || []).map((p: any) => [p.id, p]));
      const adminsByBar = new Map<string, any[]>();
      (allAdmins || []).forEach((a: any) => {
        if (!adminsByBar.has(a.bar_id)) adminsByBar.set(a.bar_id, []);
        const prof = pMap.get(a.user_id);
        adminsByBar.get(a.bar_id)!.push({ user_id: a.user_id, display_name: prof?.display_name || "未知" });
      });
      setBars(data.map((b: any) => ({ ...b, ownerName: Array.isArray(b.owner) ? b.owner[0]?.display_name : b.owner?.display_name, admins: adminsByBar.get(b.id) || [] })));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadBars(); }, [loadBars]);

  async function searchUser(q: string) {
    setSearchQ(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase.from("profiles").select("id,display_name").ilike("display_name", "%"+q+"%").limit(10);
    setSearchResults(data || []);
  }

  async function setOwner(barSlug: string, ownerId: string | null) {
    const res = await fetch("/api/admin/bars/"+barSlug+"/owner", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ownerId }) });
    if (res.ok) { setSelectedBar(null); setSearchQ(""); setSearchResults([]); loadBars(); }
    else { const e = await res.json(); alert(e.error); }
  }

  if (loading) return <div className="py-12 text-center text-[#9ca3af]">加载中...</div>;

  return (
    <div>
      <h1 className="text-lg md:text-xl font-semibold text-[#1f2937] mb-4 md:mb-6">社区管理 · 区主任命</h1>

      <div className="space-y-3">
        {bars.map((bar: any) => (
          <div key={bar.id} className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{bar.icon}</span>
                <div>
                  <Link href={"/b/"+bar.slug} className="font-semibold text-[#1f2937] hover:text-[#1a7f5a]">{bar.name}</Link>
                  <span className="text-[11px] text-[#9ca3af] ml-2">{bar.member_count}成员</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[#6b7280]">
                  区主: {bar.ownerName ? <span className="text-amber-600 font-medium">{bar.ownerName} 👑</span> : <span className="text-[#9ca3af]">未设置</span>}
                </span>
                <button onClick={() => { setSelectedBar(selectedBar===bar.slug?null:bar.slug); setSearchQ(""); setSearchResults([]); }}
                  className="rounded-full border px-3 py-1 text-[11px] text-[#6b7280] hover:border-[#1a7f5a] min-h-[32px]">
                  {selectedBar===bar.slug?"取消":"修改区主"}
                </button>
              </div>
            </div>

            {/* Admin list */}
            {bar.admins.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {bar.admins.map((a: any) => (
                  <span key={a.user_id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-[#6b7280]">
                    🛡️ {a.display_name}
                  </span>
                ))}
              </div>
            )}

            {/* Owner selection for this bar */}
            {selectedBar === bar.slug && (
              <div className="mt-3 p-3 bg-[#f9fafb] rounded-lg">
                <input type="text" value={searchQ} onChange={e => searchUser(e.target.value)} placeholder="搜索用户设置区主..."
                  className="w-full h-9 rounded-lg border px-3 text-[13px] outline-none focus:border-[#1a7f5a]" />
                {searchResults.length > 0 && (
                  <div className="mt-2 border rounded-lg divide-y max-h-[180px] overflow-y-auto bg-white">
                    {searchResults.map((u: any) => (
                      <button key={u.id} onClick={() => setOwner(bar.slug, u.id)} className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#e8f5ef]">{u.display_name || "未命名"}</button>
                    ))}
                  </div>
                )}
                {bar.ownerName && (
                  <button onClick={() => setOwner(bar.slug, null)} className="mt-2 text-[12px] text-red-500 hover:underline">移除区主</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-[#fef3c7] rounded-lg text-[12px] text-[#92400e]">
        💡 区主拥有管理本区的权限（删帖/置顶/加精/任命管理员）。区主可在 /bar-admin/[slug] 管理社区。
      </div>
    </div>
  );
}
