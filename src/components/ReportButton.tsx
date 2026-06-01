'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ReportButton({ targetType, targetId, className = '' }: { targetType: string; targetId: string; className?: string }) {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const supabase = createClient();

  const reasons = [
    { value: 'illegal', label: '违规内容（保护动物/联系方式）' },
    { value: 'fake', label: '虚假信息' },
    { value: 'harass', label: '骚扰/人身攻击' },
    { value: 'spam', label: '垃圾广告' },
    { value: 'other', label: '其他' },
  ];

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }
    await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      report_reason: reason,
      status: 'pending',
    });
    setSubmitting(false);
    setDone(true);
    setTimeout(() => { setShowForm(false); setDone(false); }, 2000);
  }

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className={'inline-flex items-center gap-1 text-[11px] text-[#9ca3af] hover:text-red-500 transition-colors ' + className}
        title="举报"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
        </svg>
        举报
      </button>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1f2937] mb-4">举报</h3>
            {done ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2">OK</p>
                <p className="text-[14px] text-[#1a7f5a] font-medium">举报已提交，感谢您的反馈</p>
              </div>
            ) : (
              <>
                <label className="block text-[13px] font-medium text-[#4b5563] mb-2">举报原因</label>
                <div className="space-y-1.5 mb-4">
                  {reasons.map(r => (
                    <label
                      key={r.value}
                      className={'flex items-center gap-2 p-2.5 rounded-lg cursor-pointer text-[13px] transition-colors ' + (reason === r.value ? 'bg-red-50 text-red-700' : 'hover:bg-[#f9fafb] text-[#4b5563]')}
                    >
                      <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={e => setReason(e.target.value)} className="text-[#1a7f5a]" />
                      {r.label}
                    </label>
                  ))}
                </div>
                <textarea
                  value={detail}
                  onChange={e => setDetail(e.target.value)}
                  placeholder="补充说明（可选）"
                  rows={2}
                  className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-[13px] outline-none focus:border-[#1a7f5a] resize-none mb-4"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 rounded-full border border-[#e5e7eb] py-2 text-[13px] text-[#6b7280] hover:bg-[#f9fafb]">取消</button>
                  <button onClick={handleSubmit} disabled={!reason || submitting} className="flex-1 rounded-full bg-red-500 py-2 text-[13px] font-medium text-white hover:bg-red-600 disabled:opacity-50">
                    {submitting ? '提交中...' : '提交举报'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
