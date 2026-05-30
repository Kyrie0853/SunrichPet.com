"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

const SPLASH_KEY = "splash_shown";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);

  // 仅在客户端挂载后决定是否展示
  useEffect(() => {
    const alreadyShown = sessionStorage.getItem(SPLASH_KEY);
    if (alreadyShown) return;

    sessionStorage.setItem(SPLASH_KEY, "1");
    setVisible(true);

    const timer = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => setVisible(false), []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          onClick={dismiss}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex cursor-pointer flex-col items-center justify-center bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-700"
        >
          {/* 品牌名 */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="select-none text-5xl font-extrabold tracking-widest text-white drop-shadow-lg sm:text-6xl"
          >
            顺瑞益宠
          </motion.h1>

          {/* 副标题 */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7, ease: "easeOut" }}
            className="mt-5 select-none text-lg tracking-wide text-white/80 sm:text-xl"
          >
            为您提供专业、省心的宠物服务
          </motion.p>

          {/* 点击提示 */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.4 }}
            className="mt-12 select-none text-sm tracking-wider text-white/40"
          >
            点击任意位置进入
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
