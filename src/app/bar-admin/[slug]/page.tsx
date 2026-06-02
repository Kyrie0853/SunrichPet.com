"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function BarAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  return <BarAdminContent params={params} />;
}

function BarAdminContent({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const [slug, setSlug] = useState<string | null>(null);
  const [bar, setBar] = useState<any>(null);
  const [tab, setTab] = useState<"posts"|"admins"|"settings">("posts");
  const [posts, setPosts] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [barDesc, setBarDesc] = useState("");
  const [barRules, setBarRules] = useState("");

  useEffect(() => { params.then(p => setSlug(p.slug)); }, [params]);

  const loadData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }
    const { data: barData } = await supabase.from("bars").select("*").eq("slug", slug).single();
    if (!barData) { setLoading(false); return; }
    setBar(barData);
    setBarDesc(barData.description || "");
    setBarRules(barData.rules || "");
    const { data: roleData } = await supabase.rpc("get_bar_role", { p_user_id: user.id, p_bar_slug: slug });
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const isSuper = profile?.role === "admin" || profile?.role === "super_admin";
    if (roleData !== "owner" && roleData !== "bar_admin" && !isSuper) { router.push("/b/" + slug); return; }
    setIsOwner(roleData === "owner" || isSuper);
    const { data: postData } = await supabase.from("community_posts").select("id,title,author_id,created_at,is_pinned,is_featured").eq("bar_id", barData.id).order("created_at", { ascending: false }).limit(50);
    setPosts(postData || []);
    const { data: adminData } = await supabase.from("bar_admins").select("user_id").eq("bar_id", barData.id);
    if (adminData?.length) {
      const ids = adminData.map((a: any) => a.user_id);
      const { data: users } = await supabase.from("profiles").select("id,display_name").in("id", ids);
      const m = new Map((users || []).map((u: any) => [u.id, u]));
      setAdmins(adminData.map((a: any) => ({ user_id: a.user_id, display_name: m.get(a.user_id)?.display_name || "未知" })));
    } else setAdmins([]);
    setLoading(false);
  }, [slug, supabase, router]);
  useEffect(() => { loadData(); }, [loadData]);

  async function togglePin(id: string, v: boolean) { await supabase.from("community_posts").update({ is_pinned: !v }).eq("id", id); setPosts(prev => prev.map(p => p.id === id ? { ...p, is_pinned: !v } : p)); }
  async function toggleFeat(id: string, v: boolean) { await supabase.from("community_posts").update({ is_featured: !v }).eq("id", id); setPosts(prev => prev.map(p => p.id === id ? { ...p, is_featured: !v } : p)); }
  async function delPost(id: string) { if (!confirm("删除该帖子？")) return; await supabase.from("community_posts").delete().eq("id", id); setPosts(prev => prev.filter(p => p.id !== id)); }
  async function searchUser(q: string) { setSearchQ(q); if (q.length < 2) { setSearchResults([]); return; } const { data } = await supabase.from("profiles").select("id,display_name").ilike("display_name", "%"+q+"%").limit(10); setSearchResults(data || []); }
  async function appointAdmin(uid: string) { const res = await fetch("/api/admin/bars/"+slug+"/admins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: uid }) }); if (res.ok) { setSearchQ(""); setSearchResults([]); loadData(); } else { const e = await res.json(); alert(e.error); } }
  async function removeAdmin(uid: string) { if (!confirm("撤销该管理员？")) return; const res = await fetch("/api/admin/bars/"+slug+"/admins?userId="+uid, { method: "DELETE" }); if (res.ok) setAdmins(prev => prev.filter(a => a.user_id !== uid)); else { const e = await res.json(); alert(e.error); } }
  async function saveSettings() { const { error } = await supabase.from("bars").update({ description: barDesc, rules: barRules }).eq("slug", slug); if (error) alert("保存失败: "+error.message); else alert("保存成功"); }

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-20 text-center text-[#9ca3af]">加载中...</div>;
  if (!bar) return <div className="mx-auto max-w-4xl px-4 py-20 text-center text-red-500">社区不存在或无权限</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href={"/b/"+slug} className="text-[13px] text-[#6b7280] hover:text-[#1a7f5a]">&larr; 返回社区</Link>
        <h1 className="text-xl font-bold text-[#1f2937]">{bar.icon} {bar.name} · 管理后台</h1>
      </div>
      <div className="flex gap-1 mb-6 border-b border-[#f3f4f6]">
        {(["posts","admins","settings"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={"px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition "+(tab===t?"border-[#1a7f5a] text-[#1a7f5a]":"border-transparent text-[#6b7280] hover:text-[#1f2937]")}>
            {t==="posts"?"📝 帖子管理":t==="admins"?"👥 管理团队":"⚙️ 社区设置"}
          </button>
        ))}
      </div>

      {tab==="posts" && (
        <div className="space-y-2">
          {posts.length===0?<p className="py-12 text-center text-[#9ca3af]">本区暂无帖子</p>:posts.map(p=>(
            <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl border p-3">
              <div className="min-w-0 flex-1"><p className="text-[14px] font-medium truncate">{p.title||"无标题"}</p><p className="text-[11px] text-[#9ca3af]">{new Date(p.created_at).toLocaleDateString("zh-CN")}</p></div>
              <div className="flex gap-1 shrink-0">
                <button onClick={()=>togglePin(p.id,p.is_pinned)} className={"rounded-full px-2.5 py-1 text-[11px] "+(p.is_pinned?"bg-red-50 text-red-600":"bg-gray-100 text-gray-500")}>{p.is_pinned?"取消置顶":"置顶"}</button>
                <button onClick={()=>toggleFeat(p.id,p.is_featured)} className={"rounded-full px-2.5 py-1 text-[11px] "+(p.is_featured?"bg-amber-50 text-amber-600":"bg-gray-100 text-gray-500")}>{p.is_featured?"取消加精":"加精"}</button>
                <button onClick={()=>delPost(p.id)} className="rounded-full px-2.5 py-1 text-[11px] text-red-500 bg-red-50">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="admins" && (
        <div>
          {isOwner && (
            <div className="mb-6 bg-white rounded-xl border p-4">
              <h3 className="text-[14px] font-semibold mb-3">任命管理员</h3>
              <input type="text" value={searchQ} onChange={e=>searchUser(e.target.value)} placeholder="搜索用户昵称..." className="w-full h-10 rounded-lg border px-3 text-[14px] outline-none focus:border-[#1a7f5a]" />
              {searchResults.length>0 && (
                <div className="mt-2 border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                  {searchResults.map((u:any)=>(<button key={u.id} onClick={()=>appointAdmin(u.id)} className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#e8f5ef]">{u.display_name||"未命名"}</button>))}
                </div>
              )}
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-amber-50 rounded-xl border border-amber-200 p-3"><span className="text-lg">👑</span><span className="text-[14px] text-amber-700">{bar.owner_id?"已设置区主":"暂未设置区主"}</span></div>
            {admins.length===0?<p className="py-8 text-center text-[#9ca3af]">暂未任命管理员</p>:admins.map(a=>(
              <div key={a.user_id} className="flex items-center gap-3 bg-white rounded-xl border p-3"><span className="text-lg">🛡️</span><span className="flex-1 text-[14px]">{a.display_name}</span>{isOwner&&<button onClick={()=>removeAdmin(a.user_id)} className="text-[12px] text-red-500 hover:underline">撤销</button>}</div>
            ))}
          </div>
        </div>
      )}

      {tab==="settings" && (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <div><label className="block text-[13px] font-medium mb-1">社区描述</label><textarea value={barDesc} onChange={e=>setBarDesc(e.target.value)} rows={3} className="w-full rounded-lg border px-3 py-2 text-[14px] outline-none focus:border-[#1a7f5a] resize-y" /></div>
          <div><label className="block text-[13px] font-medium mb-1">社区公告/规则</label><textarea value={barRules} onChange={e=>setBarRules(e.target.value)} rows={4} className="w-full rounded-lg border px-3 py-2 text-[14px] outline-none focus:border-[#1a7f5a] resize-y" /></div>
          <button onClick={saveSettings} className="rounded-full bg-[#1a7f5a] px-6 py-2.5 text-[13px] font-medium text-white hover:bg-[#166b4b] min-h-[44px]">保存设置</button>
        </div>
      )}
    </div>
  );
}