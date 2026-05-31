"use client";

import { useState, useEffect } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // sessionStorage 记忆：同会话只显示一次
    const shown = sessionStorage.getItem("splash_shown_v2");
    if (shown) return;

    setVisible(true);
    sessionStorage.setItem("splash_shown_v2", "1");

    // 2.5 秒后自动关闭
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setVisible(false), 400); // 等淡出动画完成
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // 点击任意位置立即关闭
  function handleDismiss() {
    setFadeOut(true);
    setTimeout(() => setVisible(false), 400);
  }

  if (!visible) return null;

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f8f9fa] cursor-pointer transition-opacity duration-400 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo */}
      <div className={`transition-all duration-500 ${fadeOut ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
        <h1
          className="text-5xl md:text-6xl font-bold tracking-wider text-[#1a7f5a] select-none"
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
        >
          顺瑞益宠
        </h1>
      </div>

      {/* 副标题 */}
      <p
        className={`mt-4 text-base md:text-lg text-[#6b7280] tracking-wide select-none transition-all duration-500 delay-300 ${
          fadeOut ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        全国宠物玩家的聚集地
      </p>

      {/* 底部呼吸箭头 */}
      <div
        className={`absolute bottom-10 transition-all duration-500 delay-500 ${
          fadeOut ? "opacity-0" : "opacity-100"
        }`}
      >
        <style>{`
          @keyframes breathe {
            0%, 100% { opacity: 0.3; transform: translateY(0); }
            50% { opacity: 0.8; transform: translateY(-4px); }
          }
        `}</style>
        <div className="flex flex-col items-center gap-1 animate-pulse">
          <span className="text-[11px] text-[#9ca3af]">点击进入</span>
          <svg className="w-4 h-4 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
