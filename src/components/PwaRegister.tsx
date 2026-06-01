'use client';

import { useEffect, useState } from 'react';

export default function PwaRegister() {
  const [showInstall, setShowInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        () => console.log('SW registered'),
        (err) => console.log('SW registration failed:', err)
      );
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Hide if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstall(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    console.log('Install result:', result.outcome);
    setDeferredPrompt(null);
    setShowInstall(false);
  }

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-40">
      <div className="bg-white rounded-2xl shadow-lg border border-[#1a7f5a]/20 p-4 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1a7f5a] flex items-center justify-center text-white text-lg shrink-0">SR</div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#1f2937]">添加到主屏幕</p>
            <p className="text-[11px] text-[#9ca3af]">获得更好的浏览体验</p>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setShowInstall(false)} className="px-3 py-1.5 text-[12px] text-[#9ca3af] min-w-[44px]">以后</button>
            <button onClick={handleInstall} className="px-3 py-1.5 text-[12px] font-medium bg-[#1a7f5a] text-white rounded-full min-w-[44px]">安装</button>
          </div>
        </div>
      </div>
    </div>
  );
}
