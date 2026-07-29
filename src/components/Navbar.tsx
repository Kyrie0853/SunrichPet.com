import Link from "next/link";
import { SearchBar } from "./SearchBar";

/**
 * 轻量化导航栏 — 买家无需登录，只保留购物车入口
 * 管理员可通过页脚隐蔽链接登录
 */
export default function Navbar() {
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

        {/* 搜索框 — 占据剩余空间 */}
        <SearchBar className="hidden flex-1 max-w-sm md:block" />

        {/* 右侧图标 */}
        <div className="flex items-center gap-1 ml-auto">
          {/* 购物车 */}
          <Link
            href="/cart"
            prefetch={true}
            className="rounded-full p-2 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1f2937] transition-colors duration-200"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 003 3h4.5a3 3 0 003-3H7.5zM6.75 14.25l-1.5-6h13.5l-1.5 6H6.75zM9 17.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM19.5 17.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}
