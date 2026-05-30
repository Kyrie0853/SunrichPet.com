"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Avatar from "./Avatar";

export default function UserMenu({ user, isAdmin, unreadCount, profile }: { user: any; isAdmin: boolean; unreadCount: number; profile: any }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => { const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler); }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = "/"; };

  const displayName = profile?.display_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "用户";

  return (<div ref={ref} className="relative">
    <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 transition">
      <div className="relative">
        <Avatar userId={user.id} avatarUrl={profile?.avatar_url} displayName={displayName} size={32} />
        {unreadCount > 0 && (<span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>)}
      </div>
      <span className="hidden text-sm font-medium text-gray-700 sm:inline">{displayName}</span>
      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </button>
    {open && (<div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
      <div className="border-b border-gray-50 px-4 py-2 text-xs text-gray-400">{user.email}</div>
      <Link href="/feed" onClick={()=>setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>我的动态</Link>
      <Link href={"/community/user/"+user.id} onClick={()=>setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>个人中心</Link>
      <Link href="/community/notifications" onClick={()=>setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 relative"><svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>通知{unreadCount>0&&(<span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span>)}</Link>
      {isAdmin&&(<Link href="/admin" onClick={()=>setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>商家后台</Link>)}
      <hr className="my-1 border-gray-50" />
      <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>退出登录</button>
    </div>)}
  </div>);
}