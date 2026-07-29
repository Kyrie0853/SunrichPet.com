import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "./SearchBar";
import CartIcon from "./CartIcon";
import MobileSearchToggle from "./MobileSearchToggle";

/**
 * 轻量化导航栏 — 买家无需登录，购物车使用 localStorage
 * 管理员登录后显示"管理后台"按钮
 */
export default async function Navbar() {
  const supabase = await createClient();

  let isAdmin = false;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      isAdmin = p?.role === "admin" || p?.role === "super_admin";
    }
  } catch {
    // 忽略认证失败
  }

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm" style={{ height: 56 }}>
      <div className="mx-auto flex h-full max-w-6xl items-center gap-3 px-4">
        {/* Logo */}
        <Link
          href="/"
          prefetch={true}
          className="text-lg font-semibold tracking-tight text-[#1a7f5a] hover:opacity-80 transition-opacity duration-200 shrink-0"
        >
          给我爬
        </Link>

        {/* 搜索框 - 桌面端 */}
        <SearchBar className="hidden flex-1 max-w-sm md:block" />

        {/* 右侧 */}
        <div className="flex items-center gap-1 ml-auto">
          {/* 移动端搜索按钮 */}
          <MobileSearchToggle />

          {/* 购物车（含数量角标） */}
          <CartIcon />

          {/* 管理员后台入口 */}
          {isAdmin && (
            <Link
              href="/studio/dashboard"
              prefetch={true}
              className="rounded-full bg-[#1a7f5a] px-4 py-2 text-[13px] font-medium text-white transition-all duration-200 hover:bg-[#166b4b] active:scale-[0.97] flex items-center gap-1.5"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
              管理后台
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
