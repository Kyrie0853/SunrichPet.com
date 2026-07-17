"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Avatar from "./Avatar";

export default function UserMenu({ user, isAdmin, profile }: { user: any; isAdmin: boolean; profile: any }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => { const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler); }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = "/"; };

  const displayName = profile?.display_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "用户";

  return (<div ref={ref} className="relative">
    <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 rounded-full p-1.5 hover:bg-[#f3f4f6] transition-colors duration-200">
      <div className="relative">
        <Avatar userId={user.id} avatarUrl={profile?.avatar_url} displayName={displayName} size={32} />
      </div>
      <span className="hidden text-[13px] font-medium text-[#1f2937] sm:inline">{displayName}</span>
      <svg className="h-4 w-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </button>
    {open && (<div className="absolute right-0 mt-2 w-52 rounded-xl bg-white shadow-lg border border-[#e5e7eb] py-1.5 overflow-hidden">
      <div className="border-b border-[#f3f4f6] px-4 py-2.5 text-xs text-[#9ca3af] truncate">
        {user.email}
      </div>
      <Link href="/profile" onClick={()=>setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1f2937] hover:bg-[#f3f4f6] transition-colors duration-150">
        <svg className="h-4 w-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>个人信息
      </Link>
      <Link href="/orders" onClick={()=>setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1f2937] hover:bg-[#f3f4f6] transition-colors duration-150">
        <svg className="h-4 w-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>我的订单
      </Link>
      <Link href="/cart" onClick={()=>setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1f2937] hover:bg-[#f3f4f6] transition-colors duration-150">
        <svg className="h-4 w-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 003 3h4.5a3 3 0 003-3H7.5zM6.75 14.25l-1.5-6h13.5l-1.5 6H6.75zM9 17.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM19.5 17.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>购物车
      </Link>

      {/* Admin links */}
      {isAdmin && (
        <>
          <hr className="my-1 border-[#f3f4f6]" />
          <div className="px-4 py-1.5 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">管理</div>
          <Link href="/admin/users" onClick={()=>setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1f2937] hover:bg-[#f3f4f6] transition-colors duration-150">
            <svg className="h-4 w-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>用户管理
          </Link>
          <Link href="/studio/dashboard" onClick={()=>setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1f2937] hover:bg-[#f3f4f6] transition-colors duration-150">
            <svg className="h-4 w-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>管理后台
          </Link>
        </>
      )}
      <hr className="my-1 border-[#f3f4f6]" />
      <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#dc3545] hover:bg-[#fef2f2] transition-colors duration-150"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>退出登录</button>
    </div>)}
  </div>);
}