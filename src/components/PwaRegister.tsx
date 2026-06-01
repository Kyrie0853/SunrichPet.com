'use client';

import { useEffect, useState } from 'react';

const DISMISS_KEY = 'pwa_install_dismissed_at';
const DISMISS_DAYS = 7;

type EnvType = 'wechat_ios' | 'safari_ios' | 'chrome_android' | 'other_android' | 'other';

function detectEnv(): EnvType {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isWeChat = /MicroMessenger/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|OPiOS|mercury/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isChrome = /Chrome/.test(ua) && !/Edge|OPR|SamsungBrowser/.test(ua);

  if (isIOS && isWeChat) return 'wechat_ios';
  if (isIOS && isSafari) return 'safari_ios';
  if (isAndroid && isChrome) return 'chrome_android';
  if (isAndroid) return 'other_android';
  return 'other';
}

export default function PwaRegister() {
  const [env, setEnv] = useState<EnvType>('other');
  const [showBanner, setShowBanner] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const e = detectEnv();
    setEnv(e);
    if (e === 'other') return;

    // Already installed or dismissed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - parseInt(dismissed) < DISMISS_DAYS * 86400000) return;

    // Register SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Android Chrome: listen for beforeinstallprompt
    const handler = (ev: Event) => { ev.preventDefault(); setDeferredPrompt(ev); setShowBanner(true); };
    window.addEventListener('beforeinstallprompt', handler);

    // Show banner after delay
    const t = setTimeout(() => { if (!deferredPrompt) setShowBanner(true); }, 3000);

    return () => { window.removeEventListener('beforeinstallprompt', handler); clearTimeout(t); };
  }, [deferredPrompt]);

  function dismiss() {
    setShowBanner(false);
    setShowGuide(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }

  async function handleAction() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') setShowBanner(false);
      setDeferredPrompt(null);
    } else {
      setShowGuide(true);
    }
  }

  if (!showBanner || env === 'other') return null;

  // Banner text by environment
  const bannerText: Record<EnvType, { title: string; sub: string; btn: string }> = {
    wechat_ios: { title: '在 Safari 中打开，即可添加到桌面', sub: '微信内不支持添加到桌面', btn: '查看指引' },
    safari_ios: { title: '添加到桌面，使用更便捷', sub: '点击底部分享按钮 → 添加到主屏幕', btn: '查看指引' },
    chrome_android: { title: '添加到桌面，使用更便捷', sub: '像 App 一样打开顺瑞益宠', btn: deferredPrompt ? '立即添加' : '查看指引' },
    other_android: { title: '在 Chrome 中打开，可添加到桌面', sub: '当前浏览器不支持', btn: '查看指引' },
    other: { title: '', sub: '', btn: '' },
  };
  const txt = bannerText[env];

  return (
    <>
      {/* 安装横幅 */}
      <div className="fixed bottom-20 md:bottom-4 left-2 right-2 md:left-auto md:right-4 md:w-80 z-40 animate-fade-in-up">
        <div className="bg-[#1a7f5a] rounded-2xl shadow-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg shrink-0">SR</div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold">{txt.title}</p>
              <p className="text-[11px] text-white/70 mt-0.5">{txt.sub}</p>
            </div>
            <button onClick={dismiss} className="p-1 text-white/60 hover:text-white min-w-[32px] min-h-[32px] flex items-center justify-center shrink-0">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={dismiss} className="flex-1 rounded-full border border-white/30 py-2 text-[12px] text-white/80 hover:bg-white/10 min-h-[40px]">以后再说</button>
            <button onClick={handleAction} className="flex-1 rounded-full bg-white py-2 text-[12px] font-semibold text-[#1a7f5a] hover:bg-white/90 min-h-[40px]">{txt.btn}</button>
          </div>
        </div>
      </div>

      {/* 引导弹窗 — 根据环境显示不同内容 */}
      {showGuide && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-4" onClick={() => setShowGuide(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mb-4 p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1f2937] mb-4 text-center">如何添加到桌面</h3>

            {env === 'wechat_ios' && (
              <div className="space-y-4 text-[14px] text-[#4b5563]">
                {[
                  { num: '1', text: '点击右上角', highlight: '「···」' },
                  { num: '2', text: '选择', highlight: '「在 Safari 中打开」' },
                  { num: '3', text: '在 Safari 中点击底部分享 →', highlight: '「添加到主屏幕」' },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#1a7f5a] text-white flex items-center justify-center text-[13px] font-bold shrink-0">{s.num}</span>
                    <div><p className="font-medium">{s.text}</p><p className="text-[#1a7f5a] font-bold">{s.highlight}</p></div>
                  </div>
                ))}
              </div>
            )}

            {env === 'safari_ios' && (
              <div className="space-y-4 text-[14px] text-[#4b5563]">
                {[
                  { num: '1', text: '点击底部', highlight: '分享按钮' },
                  { num: '2', text: '向下滑动找到', highlight: '「添加到主屏幕」' },
                  { num: '3', text: '点击', highlight: '「添加」' },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#1a7f5a] text-white flex items-center justify-center text-[13px] font-bold shrink-0">{s.num}</span>
                    <div><p className="font-medium">{s.text}</p><p className="text-[#1a7f5a] font-bold">{s.highlight}</p></div>
                  </div>
                ))}
              </div>
            )}

            {(env === 'chrome_android' || env === 'other_android') && (
              <div className="space-y-4 text-[14px] text-[#4b5563]">
                {env === 'chrome_android' ? (
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#1a7f5a] text-white flex items-center justify-center text-[13px] font-bold shrink-0">1</span>
                    <div><p className="font-medium">点击右上角</p><p className="text-[#1a7f5a] font-bold">「⋮」→ 「添加到主屏幕」</p></div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-[#1a7f5a] text-white flex items-center justify-center text-[13px] font-bold shrink-0">1</span>
                      <div><p className="font-medium">复制网站地址</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-[#1a7f5a] text-white flex items-center justify-center text-[13px] font-bold shrink-0">2</span>
                      <div><p className="font-medium">在 Chrome 中打开</p><p className="text-[#1a7f5a] font-bold">⋮ → 添加到主屏幕</p></div>
                    </div>
                  </>
                )}
              </div>
            )}

            <button onClick={() => { setShowGuide(false); dismiss(); }}
              className="w-full mt-5 rounded-full bg-[#1a7f5a] py-3 text-[14px] font-semibold text-white min-h-[44px]">我知道了</button>
          </div>
        </div>
      )}
    </>
  );
}
