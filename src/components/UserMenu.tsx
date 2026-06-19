"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Avatar from "./Avatar";

export default function UserMenu({ user, isAdmin, isSeller, unreadCount, unreadMsgCount, profile, currentPoints, canCheckIn, streak }: { user: any; isAdmin: boolean; isSeller?: boolean; unreadCount: number; unreadMsgCount: number; profile: any; currentPoints: number; canCheckIn: boolean; streak: number }) {
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
        {unreadCount > 0 && (<span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#f0a04b] text-[10px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>)}
      </div>
      <span className="hidden text-[13px] font-medium text-[#1f2937] sm:inline">{displayName}</span>
      <svg className="h-4 w-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </button>
    {open && (<div className="absolute right-0 mt-2 w-52 rounded-xl bg-white shadow-lg border border-[#e5e7eb] py-1.5 overflow-hidden">
      <div className="border-b border-[#f3f4f6] px-4 py-2.5 text-xs text-[#9ca3af] flex items-center justify-between">
        <span className="truncate max-w-[140px]">{user.email}</span>
        <span className="text-[#f0a04b] font-semibold shrink-0 ml-2">⭐ {currentPoints}</span>
      </div>
      <Link href="/feed" onClick={()=>setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1f2937] hover:bg-[#f3f4f6] transition-colors duration-150"><svg className="h-4 w-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>我的动态</Link>
      <Link href="/messages" onClick={()=>setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1f2937] hover:bg-[#f3f4f6] transition-colors duration-150 relative"><svg className="h-4 w-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>私信{unreadMsgCount>0&&(<span className="ml-auto rounded-full bg-[#f0a04b] px-1.5 py-0.5 text-[10px] font-bold text-white">{unreadMsgCount}</span>)}</Link>
      {canCheckIn && (
        <button onClick={async()=>{const{error}=await supabase.rpc("daily_check_in");if(!error){window.location.reload();}}}
          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#f0a04b] hover:bg-amber-50 transition-colors duration-150">
          <svg className="h-4 w-4 text-[#f0a04b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          签到 +3
        </button>
      )}
      {!canCheckIn && streak > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-[#9ca3af]">
          🔥 连续签到 {streak} 天
        </div>
      )}
      <Link href={"/community/user/"+user.id} onClick={()=>setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1f2937] hover:bg-[#f3f4f6] transition-colors duration-150"><svg className="h-4 w-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>个人中心</Link>
      <Link href="/community/notifications" onClick={()=>setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1f2937] hover:bg-[#f3f4f6] transition-colors duration-150 relative"><svg className="h-4 w-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>通知{unreadCount>0&&(<span className="ml-auto rounded-full bg-[#f0a04b] px-1.5 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span>)}</Link>
      {isSeller && <Link href="/seller/dashboard" onClick={()=>setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1f2937] hover:bg-[#f3f4f6] transition-colors duration-150"><svg className="h-4 w-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>商家后台</Link>}
      {isAdmin&&(<Link href="/studio/dashboard" onClick={()=>setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1f2937] hover:bg-[#f3f4f6] transition-colors duration-150"><svg className="h-4 w-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>工作室后台</Link>)}
      {isAdmin&&(<Link href="/admin" onClick={()=>setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1f2937] hover:bg-[#f3f4f6] transition-colors duration-150"><svg className="h-4 w-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>平台管理</Link>)}
      <hr className="my-1 border-[#f3f4f6]" />
      <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#dc3545] hover:bg-[#fef2f2] transition-colors duration-150"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>退出登录</button>
    </div>)}
  </div>);
}