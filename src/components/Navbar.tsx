import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import UserMenu from "./UserMenu";
import { SearchBar } from "./SearchBar";
import NavLinks from "./NavLinks";
import { getUnreadMessageCount } from "@/lib/supabase/community";

export default async function Navbar() {
  const supabase = await createClient();

  let user = null;
  let isAdmin = false;
  let isSeller = false;
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
      isAdmin = p?.role === "admin" || p?.role === "super_admin";
      isSeller = p?.role === "seller";
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
      unreadMsgCount = await getUnreadMessageCount(user.id);
    } catch {
      // messages 表可能尚未迁移，忽略
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm" style={{ height: 56 }}>
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-[#1a7f5a] hover:opacity-80 transition-opacity duration-200"
        >
          Sunrich Pet 爬宠工作室
        </Link>

        {/* 中间导航（桌面端可见，客户端动态高亮） */}
        <NavLinks />

        {/* 搜索框 */}
        <SearchBar className="hidden flex-1 max-w-sm mx-6 md:block" />

        {/* 右侧 */}
        <div className="flex items-center gap-2">
          {/* 购物车 */}
          <Link
            href="/cart"
            className="rounded-full p-2 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937] transition-colors duration-200"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 003 3h4.5a3 3 0 003-3H7.5zM6.75 14.25l-1.5-6h13.5l-1.5 6H6.75zM9 17.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM19.5 17.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            </svg>
          </Link>

          {user ? (
            <UserMenu user={user} isAdmin={isAdmin} isSeller={isSeller} unreadCount={unreadCount} unreadMsgCount={unreadMsgCount} profile={profile} currentPoints={profile?.points||0} canCheckIn={profile?.check_in_date !== new Date().toISOString().slice(0,10)} streak={profile?.check_in_streak||0} />
          ) : (
            <Link
              href="/auth"
              className="rounded-full bg-[#1a7f5a] px-5 py-2 text-[13px] font-medium text-white transition-all duration-200 hover:bg-[#166b4b] active:scale-[0.97]"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
