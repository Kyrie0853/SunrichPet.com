'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ReportCenterPage() {
  const [targetType, setTargetType] = useState('post');
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const reasons = [
    { value: 'illegal', label: '违规内容（保护动物/联系方式）' },
    { value: 'fake', label: '虚假信息/诈骗' },
    { value: 'harass', label: '骚扰/人身攻击' },
    { value: 'spam', label: '垃圾广告' },
    { value: 'other', label: '其他违规行为' },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!targetId || !reason) { setError('请填写必要信息'); return; }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('请先登录'); setSubmitting(false); return; }
    const { error: submitErr } = await supabase.from('reports').insert({
      reporter_id: user.id, target_type: targetType, target_id: targetId,
      report_reason: reason, status: 'pending',
    });
    if (submitErr) { setError('提交失败：' + submitErr.message); setSubmitting(false); return; }
    setDone(true); setSubmitting(false);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-5xl mb-4">✅</p>
        <h1 className="text-2xl font-bold text-[#1f2937] mb-2">举报已提交</h1>
        <p className="text-[#6b7280]">平台管理员将尽快处理您的举报，感谢您为社区安全做出的贡献。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold text-[#1f2937] mb-2">举报中心</h1>
      <p className="text-[#6b7280] text-[14px] mb-8">发现违规内容？请在此提交举报</p>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-[13px] text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-[#4b5563] mb-1">举报类型</label>
          <select value={targetType} onChange={e => setTargetType(e.target.value)}
            className="w-full h-10 rounded-lg border px-3 text-[14px] outline-none focus:border-[#1a7f5a]">
            <option value="post">帖子</option>
            <option value="product">商品</option>
            <option value="comment">评论</option>
            <option value="user">用户</option>
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#4b5563] mb-1">目标ID（帖子/商品/用户ID）</label>
          <input type="text" value={targetId} onChange={e => setTargetId(e.target.value)}
            className="w-full h-10 rounded-lg border px-3 text-[14px] outline-none focus:border-[#1a7f5a]" placeholder="请输入要举报对象的ID" />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#4b5563] mb-2">举报原因</label>
          <div className="space-y-1.5">
            {reasons.map(r => (
              <label key={r.value} className={'flex items-center gap-2 p-2.5 rounded-lg cursor-pointer text-[13px] transition-colors ' + (reason === r.value ? 'bg-red-50 text-red-700' : 'hover:bg-[#f9fafb] text-[#4b5563]')}>
                <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={e => setReason(e.target.value)} />{r.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#4b5563] mb-1">补充说明</label>
          <textarea value={detail} onChange={e => setDetail(e.target.value)} rows={3}
            className="w-full rounded-lg border px-3 py-2 text-[14px] outline-none focus:border-[#1a7f5a] resize-none" placeholder="请详细描述违规情况（可选）" />
        </div>

        <button type="submit" disabled={submitting}
          className="w-full rounded-full bg-red-500 py-3 text-[15px] font-semibold text-white hover:bg-red-600 disabled:opacity-50">
          {submitting ? '提交中...' : '提交举报'}
        </button>
      </form>
    </div>
  );
}
