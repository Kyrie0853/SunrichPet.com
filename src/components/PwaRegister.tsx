'use client';

import { useEffect, useState } from 'react';

// localStorage 键名
const DISMISS_KEY = 'pwa_install_dismissed_at';
const DISMISS_DAYS = 7;

export default function PwaRegister() {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 检测平台
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) setPlatform('ios');
    else if (/Android/.test(ua)) setPlatform('android');

    // 已安装或7天内关闭过 → 不显示
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const ago = Date.now() - parseInt(dismissed);
      if (ago < DISMISS_DAYS * 86400000) return;
    }

    // 注册 SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Android: beforeinstallprompt
    if (platform === 'android') {
      const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); setShowBanner(true); };
      window.addEventListener('beforeinstallprompt', handler);
      // 超时回退：5秒内未触发则显示手动引导
      const t = setTimeout(() => { if (!deferredPrompt) setShowBanner(true); }, 5000);
      return () => { window.removeEventListener('beforeinstallprompt', handler); clearTimeout(t); };
    }

    // iOS: 延迟显示气泡引导
    if (platform === 'ios') {
      const t = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(t);
    }
  }, [platform, deferredPrompt]);

  function dismiss() {
    setShowBanner(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }

  async function handleInstall() {
    if (!deferredPrompt) { dismiss(); return; }
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') setShowBanner(false);
    setDeferredPrompt(null);
  }

  if (!showBanner) return null;

  const isIOS = platform === 'ios';

  return (
    <div className="fixed bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-4 md:w-80 z-40 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-xl border border-[#1a7f5a]/15 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1a7f5a] flex items-center justify-center text-white text-lg shrink-0 mt-0.5">SR</div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#1f2937]">添加到桌面</p>
            {isIOS ? (
              <p className="text-[12px] text-[#6b7280] mt-0.5 leading-relaxed">
                点击下方 <span className="inline-block align-middle"><svg className="h-4 w-4 text-[#3b82f6]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></span>
                分享按钮 → <strong>添加到主屏幕</strong>
              </p>
            ) : (
              <p className="text-[12px] text-[#6b7280] mt-0.5">体验更流畅，快速访问</p>
            )}
          </div>
          <button onClick={dismiss} className="p-1 text-[#d1d5db] hover:text-[#6b7280] min-w-[32px] min-h-[32px] flex items-center justify-center shrink-0">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        {!isIOS && (
          <div className="flex gap-2 mt-3">
            <button onClick={dismiss} className="flex-1 rounded-full border border-[#e5e7eb] py-2 text-[12px] text-[#6b7280] min-h-[40px]">以后再说</button>
            <button onClick={handleInstall} className="flex-1 rounded-full bg-[#1a7f5a] py-2 text-[12px] font-medium text-white min-h-[40px]">{deferredPrompt ? '安装应用' : '知道了'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
