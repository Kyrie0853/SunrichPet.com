"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (pathname !== prevPathname) {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setPrevPathname(pathname);
        setIsVisible(true);
      }, 80);
      return () => clearTimeout(timer);
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
