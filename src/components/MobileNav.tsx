"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TABS = [
  { href: "/", label: "商城", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
  { href: "/search", label: "搜索", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { href: "/cart", label: "购物车", icon: "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 003 3h4.5a3 3 0 003-3H7.5zM6.75 14.25l-1.5-6h13.5l-1.5 6H6.75zM9 17.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM19.5 17.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" },
  { href: "/profile", label: "我的", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", authRequired: true },
];

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  function handleTabClick(e: React.MouseEvent, tab: typeof TABS[number]) {
    if (!tab.authRequired) return;
    if (!userId) {
      e.preventDefault();
      router.push("/auth");
    }
  }

  function getTabHref(tab: typeof TABS[number]) {
    return tab.href;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#f3f4f6] bg-white md:hidden safe-area-bottom">
      <div className="flex items-center justify-around">
        {TABS.map(tab => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link key={tab.href} href={getTabHref(tab)}
              onClick={(e) => handleTabClick(e, tab)}
              className={"flex flex-col items-center gap-0.5 py-2 min-w-[56px] transition-colors duration-200 " + (active ? "text-[#1a7f5a]" : "text-[#9ca3af]")}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
