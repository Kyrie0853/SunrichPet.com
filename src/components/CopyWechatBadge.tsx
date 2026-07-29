"use client";

import { useState } from "react";

const WECHAT_ID = "geiwopa112";

export default function CopyWechatBadge() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(WECHAT_ID).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback: select text manually
      const el = document.getElementById("wechat-id-text");
      if (el) {
        const range = document.createRange();
        range.selectNode(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="w-full rounded-xl bg-white border border-[#1a7f5a]/30 px-4 py-3 flex items-center justify-center gap-3 hover:bg-[#f0faf5] transition-colors active:scale-[0.98]"
    >
      <span className="text-xl">💬</span>
      <div className="text-left">
        <p className="text-[12px] text-[#9ca3af]">下单或咨询请加客服微信</p>
        <p id="wechat-id-text" className="text-[16px] font-bold text-[#1a7f5a]">{WECHAT_ID}</p>
      </div>
      <span className={`ml-auto rounded-full px-3 py-1 text-[12px] font-medium transition-all ${copied ? "bg-[#1a7f5a] text-white" : "bg-[#e8f5ef] text-[#1a7f5a]"}`}>
        {copied ? "✅ 已复制" : "📋 复制"}
      </span>
    </button>
  );
}
