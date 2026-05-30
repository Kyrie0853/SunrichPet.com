import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import UserMenu from "./UserMenu";
import { SearchBar } from "./SearchBar";

export default async function Navbar() {
  const supabase = await createClient();

  let user = null;
  let isAdmin = false;
  let unreadCount = 0;
  let unreadMsgCount = 0;
  let profile: any = null;

  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase 不可达时跳过认证，不阻塞页面
  }

  if (user) {
    try {
      const { data: p } = await supabase
        .from("profiles")
        .select("role, display_name, avatar_url, points, level, check_in_date, check_in_streak")
        .eq("id", user.id)
        .single();
      isAdmin = p?.role === "admin";
      profile = p;
    } catch {
      // 忽略 profiles 查询失败
    }

    try {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      unreadCount = count || 0;
    } catch {
      // notifications 表可能尚未创建，忽略
    }
    try {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .neq("sender_id", user.id)
        .eq("is_read", false);
      unreadMsgCount = count || 0;
    } catch {}
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-bold text-emerald-700 hover:text-emerald-800"
        >
          Sunrich Pet
        </Link>

        {/* 中间导航（桌面端可见） */}
        <div className="hidden items-center gap-1 text-sm font-medium md:flex">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
          >
            论坛
          </Link>
          <Link
            href="/shop"
            className="rounded-md px-3 py-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            商城
          </Link>
        </div>

        {/* 搜索框 */}
        <SearchBar className="hidden flex-1 max-w-sm mx-4 md:block" />

        {/* 右侧 */}
        <div className="flex items-center gap-3 text-sm">
          {/* 购物车 */}
          <Link
            href="/cart"
            className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 003 3h4.5a3 3 0 003-3H7.5zM6.75 14.25l-1.5-6h13.5l-1.5 6H6.75zM9 17.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM19.5 17.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            </svg>
          </Link>

          {user ? (
            <UserMenu user={user} isAdmin={isAdmin} unreadCount={unreadCount} unreadMsgCount={unreadMsgCount} profile={profile} currentPoints={profile?.points||0} canCheckIn={profile?.check_in_date !== new Date().toISOString().slice(0,10)} streak={profile?.check_in_streak||0} />
          ) : (
            <Link
              href="/auth"
              className="rounded-md bg-emerald-600 px-4 py-1.5 font-medium text-white hover:bg-emerald-700"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
