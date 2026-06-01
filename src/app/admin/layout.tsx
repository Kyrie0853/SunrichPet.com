"use client";

import { useState, useEffect, useCallback } from "react";
import { redirect, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";

const MENU = [
  { href: "/admin", label: "仪表盘", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/admin/users", label: "用户管理", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { href: "/admin/content", label: "内容管理", icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
  { href: "/admin/products", label: "商品管理", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
  { href: "/admin/orders", label: "订单管理", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { href: "/admin/reports", label: "举报管理", icon: "M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" },
  { href: "/admin/sellers", label: "商家审核", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { href: "/admin/settings", label: "系统设置", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { redirect("/auth"); return; }
      setUser(u);

      const { data: p } = await supabase.from("profiles").select("role,display_name,avatar_url").eq("id", u.id).single();
      if (!p || (p.role !== "admin" && p.role !== "super_admin")) {
        redirect("/?error=unauthorized");
        return;
      }
      setProfile(p);
      setAuthChecked(true);
    }
    checkAuth();
  }, [supabase]);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="text-[#9ca3af] text-[14px]">验证权限中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      {/* ===== 桌面端固定侧边栏 ===== */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-[#f3f4f6] flex-col z-40">
        <SidebarContent currentRole={profile.role} />
      </aside>

      {/* ===== 移动端抽屉侧边栏 ===== */}
      {sidebarOpen && (
        <>
          {/* 遮罩层 */}
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 transition-opacity" onClick={() => setSidebarOpen(false)} />
          {/* 抽屉 */}
          <aside className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-[#f3f4f6] flex flex-col z-50 shadow-xl animate-slide-in-left">
            <div className="h-14 flex items-center justify-between px-5 border-b border-[#f3f4f6]">
              <span className="text-lg font-semibold text-[#1a7f5a]">顺瑞益宠</span>
              <button onClick={() => setSidebarOpen(false)} className="p-2 -mr-2 text-[#9ca3af] hover:text-[#1f2937] min-w-[44px] min-h-[44px] flex items-center justify-center">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <SidebarContent currentRole={profile.role} onItemClick={() => setSidebarOpen(false)} />
          </aside>
        </>
      )}

      {/* ===== 主内容区 ===== */}
      <div className="flex-1 flex flex-col md:ml-60">
        {/* 顶部栏 */}
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#f3f4f6] flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* 汉堡按钮 - 仅移动端 */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-[#6b7280] hover:text-[#1f2937] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="打开菜单"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-[15px] font-semibold text-[#1f2937]">管理后台</h2>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="text-[12px] text-[#6b7280] hover:text-[#1a7f5a] transition-colors hidden sm:inline">← 返回前台</Link>
            <div className="flex items-center gap-2">
              <Avatar userId={user.id} avatarUrl={profile.avatar_url} displayName={profile.display_name} size={28} />
              <span className="text-[13px] font-medium text-[#1f2937] hidden sm:inline">{profile.display_name || "管理员"}</span>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 p-4 md:p-6">{children}</main>

        {/* ===== 移动端底部导航栏 ===== */}
        <nav className="md:hidden sticky bottom-0 z-30 bg-white border-t border-[#f3f4f6] safe-area-bottom">
          <div className="flex items-center justify-around">
            {MENU.filter(m => ["/admin", "/admin/users", "/admin/content", "/admin/settings"].includes(m.href)).map(item => {
              const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={"flex flex-col items-center gap-0.5 py-2 min-w-[56px] transition-colors duration-200 " + (active ? "text-[#1a7f5a]" : "text-[#9ca3af]")}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

// 侧边栏内容（桌面端和移动端复用）
function SidebarContent({ currentRole, onItemClick }: { currentRole: string; onItemClick?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {/* 桌面端 Logo（移动端抽屉已在外部渲染） */}
      <div className="hidden md:flex h-14 items-center gap-2 px-5 border-b border-[#f3f4f6]">
        <span className="text-lg font-semibold text-[#1a7f5a]">顺瑞益宠</span>
        <span className="text-[11px] text-[#9ca3af] bg-[#f3f4f6] px-1.5 py-0.5 rounded">后台</span>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {MENU.map(item => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={"flex items-center gap-2.5 px-3 py-2.5 md:py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 min-h-[44px] " +
                (active ? "bg-[#e8f5ef] text-[#1a7f5a]" : "text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937]")}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-[#f3f4f6] text-[11px] text-[#9ca3af]">
        角色: {currentRole === "super_admin" ? "超级管理员" : currentRole === "admin" ? "管理员" : "商家"}
      </div>
    </>
  );
}
