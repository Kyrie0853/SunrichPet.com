'use client';

import { useEffect, useState } from 'react';

const DISMISS_KEY = 'pwa_install_dismissed_at';
const DISMISS_DAYS = 7;

export default function PwaRegister() {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) setPlatform('ios');
    else if (/Android/.test(ua)) setPlatform('android');

    // Already installed or dismissed within 7 days
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - parseInt(dismissed) < DISMISS_DAYS * 86400000) return;

    // Register SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Listen for install prompt immediately (before platform detection completes)
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); setShowBanner(true); };
    window.addEventListener('beforeinstallprompt', handler);

    // Show banner after delay for all platforms
    const t = setTimeout(() => {
      if (!deferredPrompt) setShowBanner(true);
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(t);
    };
  }, [deferredPrompt]);

  function dismiss() {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') setShowBanner(false);
      setDeferredPrompt(null);
    } else if (platform === 'ios') {
      setShowIOSGuide(true);
    }
  }

  if (!showBanner) return null;

  return (
    <>
      {/* 安装横幅 */}
      <div className="fixed bottom-20 md:bottom-4 left-2 right-2 md:left-auto md:right-4 md:w-80 z-40 animate-fade-in-up">
        <div className="bg-[#1a7f5a] rounded-2xl shadow-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg shrink-0">SR</div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold">添加到桌面，使用更便捷</p>
              <p className="text-[11px] text-white/70 mt-0.5">像 App 一样打开顺瑞益宠</p>
            </div>
            <button onClick={dismiss} className="p-1 text-white/60 hover:text-white min-w-[32px] min-h-[32px] flex items-center justify-center shrink-0">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={dismiss} className="flex-1 rounded-full border border-white/30 py-2 text-[12px] text-white/80 hover:bg-white/10 min-h-[40px]">以后再说</button>
            <button onClick={handleInstall} className="flex-1 rounded-full bg-white py-2 text-[12px] font-semibold text-[#1a7f5a] hover:bg-white/90 min-h-[40px]">
              {platform === 'ios' ? '查看指引' : deferredPrompt ? '立即添加' : '知道了'}
            </button>
          </div>
        </div>
      </div>

      {/* iOS 引导弹窗 */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-4" onClick={() => setShowIOSGuide(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mb-4 p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1f2937] mb-4 text-center">添加到主屏幕</h3>
            <div className="space-y-4 text-[14px] text-[#4b5563]">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#1a7f5a] text-white flex items-center justify-center text-[13px] font-bold shrink-0">1</span>
                <div>
                  <p className="font-medium">点击底部 <span className="inline-flex items-center px-1.5 py-0.5 bg-[#f3f4f6] rounded text-[#3b82f6] text-[13px]">
                    <svg className="h-4 w-4 mr-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
                  </span> 分享按钮</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#1a7f5a] text-white flex items-center justify-center text-[13px] font-bold shrink-0">2</span>
                <div><p className="font-medium">向下滑动找到</p><p className="text-[#1a7f5a] font-bold text-lg mt-0.5">➕ 添加到主屏幕</p></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#1a7f5a] text-white flex items-center justify-center text-[13px] font-bold shrink-0">3</span>
                <div><p className="font-medium">点击「添加」完成</p></div>
              </div>
            </div>
            <button onClick={() => { setShowIOSGuide(false); dismiss(); }} className="w-full mt-5 rounded-full bg-[#1a7f5a] py-3 text-[14px] font-semibold text-white min-h-[44px]">我知道了</button>
          </div>
        </div>
      )}
    </>
  );
}
