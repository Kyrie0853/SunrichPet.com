'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AdminSellersPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const supabase = createClient();

  const loadApps = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('seller_applications').select('*').order('created_at', { ascending: false });
    if (statusFilter) query = query.eq('status', statusFilter);
    const { data } = await query;
    setApps(data || []);
    setLoading(false);
  }, [statusFilter, supabase]);

  useEffect(() => { loadApps(); }, [loadApps]);

  async function reviewApp(appId: string, userId: string, approved: boolean) {
    const reason = approved ? '' : prompt('请输入拒绝原因：');
    if (!approved && !reason) return;

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('seller_applications').update({
      status: approved ? 'approved' : 'rejected',
      reject_reason: approved ? null : reason,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', appId);

    if (approved) {
      // 更新用户角色为 seller
      await supabase.from('profiles').update({ role: 'seller', seller_verified: true }).eq('id', userId);
      // 初始化商家评分
      await supabase.from('seller_scores').upsert({ seller_id: userId, score: 100, violation_count: 0 });
    }

    loadApps();
  }

  return (
    <div>
      <h1 className="text-lg md:text-xl font-semibold text-[#1f2937] mb-4 md:mb-6">商家入驻审核</h1>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={'shrink-0 rounded-full px-3 md:px-4 py-2 md:py-1.5 text-[13px] font-medium transition min-h-[44px] md:min-h-0 flex items-center ' +
              (statusFilter === s ? 'bg-[#1a7f5a] text-white' : 'bg-white border text-[#6b7280] hover:border-[#1a7f5a]')}>
            {s === 'pending' ? '待审核' : s === 'approved' ? '已通过' : '已拒绝'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-[#9ca3af]">加载中...</div>
        ) : apps.length === 0 ? (
          <div className="text-center py-12 text-[#9ca3af]">暂无申请</div>
        ) : (
          <div className="divide-y">
            {apps.map((app: any) => (
              <div key={app.id} className="p-3 md:p-5">
                <div className="flex items-start justify-between mb-2 md:mb-3">
                  <div>
                    <h3 className="font-medium text-[#1f2937] text-[14px] md:text-base">{app.real_name}</h3>
                    <p className="text-[12px] text-[#9ca3af] mt-0.5">{app.phone} · {app.province} {app.city}</p>
                  </div>
                  <span className={'shrink-0 rounded-full px-2 md:px-2.5 py-0.5 text-[10px] md:text-[11px] font-medium ' +
                    (app.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                     app.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700')}>
                    {app.status === 'approved' ? '已通过' : app.status === 'rejected' ? '已拒绝' : '待审核'}
                  </span>
                </div>

                <div className="text-[12px] md:text-[13px] text-[#6b7280] space-y-0.5 md:space-y-1 mb-2 md:mb-3">
                  <p>身份证：{app.id_number}</p>
                  <p>经营品类：{(app.categories || []).join('、')}</p>
                  <p>承诺书1：{app.commitment_1_agreed ? '✅ 已同意' : '❌ 未同意'}</p>
                  <p>承诺书2：{app.commitment_2_agreed ? '✅ 已同意' : '❌ 未同意'}</p>
                  {app.reject_reason && <p className="text-red-500">拒绝原因：{app.reject_reason}</p>}
                  <p className="text-[11px] text-[#d1d5db]">申请时间：{new Date(app.created_at).toLocaleString('zh-CN')}</p>
                </div>

                {app.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => reviewApp(app.id, app.user_id, true)}
                      className="rounded-full bg-[#1a7f5a] px-4 py-2 md:py-1.5 text-[13px] md:text-[12px] font-medium text-white hover:bg-[#166b4b] min-h-[44px] md:min-h-0 flex items-center">通过</button>
                    <button onClick={() => reviewApp(app.id, app.user_id, false)}
                      className="rounded-full border border-red-300 px-4 py-2 md:py-1.5 text-[13px] md:text-[12px] font-medium text-red-600 hover:bg-red-50 min-h-[44px] md:min-h-0 flex items-center">拒绝</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
