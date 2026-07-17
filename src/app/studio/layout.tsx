"use client";

import { useState, useEffect } from "react";
import { redirect, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const MENU = [
  { href: "/studio/dashboard", label: "仪表盘", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/studio/dashboard/products", label: "个体管理", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
  { href: "/studio/dashboard/orders", label: "订单管理", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
];

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function check() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { redirect("/auth"); return; }
      setUser(u);
      const { data: p } = await supabase.from("profiles").select("role,display_name").eq("id", u.id).single();
      if (!p || (p.role !== "admin" && p.role !== "super_admin")) {
        redirect("/?error=unauthorized");
        return;
      }
      setProfile(p);
      setAuthChecked(true);
    }
    check();
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (!authChecked) return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
      <div className="text-[#9ca3af] text-[14px]">验证权限中...</div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-[#f3f4f6] flex-col z-40">
        <div className="h-14 flex items-center gap-2 px-5 border-b border-[#f3f4f6]">
          <span className="text-base font-semibold text-[#1a7f5a]">工作室后台</span>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {MENU.map(item => {
            const active = item.href === "/studio/dashboard" ? pathname === "/studio/dashboard" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={"flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors min-h-[44px] " +
                  (active ? "bg-[#e8f5ef] text-[#1a7f5a]" : "text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937]")}>
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-[#f3f4f6]">
          <Link href="/" className="text-[12px] text-[#6b7280] hover:text-[#1a7f5a]">← 返回前台</Link>
        </div>
      </aside>

      {sidebarOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-white border-r z-50 shadow-xl">
            <div className="h-14 flex items-center justify-between px-5 border-b">
              <span className="text-base font-semibold text-[#1a7f5a]">工作室后台</span>
              <button onClick={() => setSidebarOpen(false)} className="p-2 text-[#9ca3af] min-w-[44px] min-h-[44px]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <nav className="flex-1 py-3 px-2 space-y-0.5">
              {MENU.map(item => {
                const active = item.href === "/studio/dashboard" ? pathname === "/studio/dashboard" : pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                    className={"flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors min-h-[44px] " +
                      (active ? "bg-[#e8f5ef] text-[#1a7f5a]" : "text-[#6b7280] hover:bg-[#f3f4f6]")}>
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col md:ml-56">
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#f3f4f6] flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-[#6b7280] min-w-[44px] min-h-[44px]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h2 className="text-[15px] font-semibold text-[#1f2937]">工作室管理</h2>
          </div>
          <span className="text-[13px] text-[#6b7280]">{profile?.display_name || "管理员"}</span>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
