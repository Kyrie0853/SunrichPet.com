"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * 轻量化页面过渡 — 最小延迟，感知为瞬间切换
 * React.memo 包装的 children 避免不必要的重新渲染
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (pathname !== prevPathname) {
      setIsVisible(false);
      // 使用 requestAnimationFrame 代替 setTimeout，避免延迟
      const raf = requestAnimationFrame(() => {
        setPrevPathname(pathname);
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [pathname, prevPathname]);

  return (
    <div
      className={isVisible ? "animate-fade-in-up" : "opacity-0"}
      key={prevPathname}
    >
      {children}
    </div>
  );
}
