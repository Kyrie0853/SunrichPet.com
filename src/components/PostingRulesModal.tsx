'use client';

import { useState, useEffect } from 'react';

export default function PostingRulesModal({ onAccept }: { onAccept: () => void }) {
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('posting_rules_accepted_at');
    if (stored) {
      const acceptedAt = parseInt(stored);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - acceptedAt < sevenDays) { onAccept(); return; }
    }
    setShow(true);
  }, [onAccept]);

  function handleAccept() {
    if (!checked) return;
    localStorage.setItem('posting_rules_accepted_at', Date.now().toString());
    setShow(false);
    onAccept();
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in-up">
        <h2 className="text-lg font-bold text-[#1f2937] mb-1">发帖须知</h2>
        <p className="text-[13px] text-[#6b7280] mb-4">请阅读并同意以下规则后再发布内容</p>
        <div className="bg-[#fef3c7] rounded-lg p-4 mb-4 text-[13px] text-[#92400e] space-y-2">
          <p>禁止交易保护动物：陆龟、蟒蛇、巨蜥、鳄鱼、鹦鹉等保护动物严禁在平台展示和交易</p>
          <p>禁止留联系方式：帖子中不得出现微信、QQ、手机号等联系方式</p>
          <p>交易走平台担保：买卖双方必须通过平台担保交易完成，禁止私下交易</p>
          <p>违规处罚：违规者将受到警告、禁言或永久封号处理</p>
        </div>
        <label className="flex items-start gap-2.5 mb-5 cursor-pointer">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1a7f5a] focus:ring-[#1a7f5a]" />
          <span className="text-[13px] text-[#4b5563] leading-relaxed">我已阅读并理解以上规则，承诺遵守平台规定</span>
        </label>
        <button onClick={handleAccept} disabled={!checked}
          className="w-full rounded-full bg-[#1a7f5a] py-2.5 text-[14px] font-semibold text-white transition-all duration-200 hover:bg-[#166b4b] disabled:opacity-40 disabled:cursor-not-allowed">
          我知道了，开始发帖
        </button>
      </div>
    </div>
  );
}
