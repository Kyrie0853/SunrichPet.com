"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "首页" },
  { href: "/shop", label: "商城" },
  { href: "/blog", label: "繁育笔记" },
];

export default function NavLinks() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <div className="hidden items-center gap-0.5 md:flex">
      {LINKS.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={
            "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200 " +
            (isActive(link.href)
              ? "text-[#1a7f5a] bg-[#e8f5ef]"
              : "text-[#6b7280] hover:text-[#1f2937] hover:bg-[#f3f4f6]")
          }
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
