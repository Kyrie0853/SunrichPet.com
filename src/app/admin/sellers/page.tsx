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

  const [rejectModal, setRejectModal] = useState<{ appId: string; userId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  async function approveApp(appId: string, userId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('seller_applications').update({
      status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString(),
    }).eq('id', appId);
    await supabase.from('profiles').update({ role: 'seller', seller_verified: true }).eq('id', userId);
    await supabase.from('seller_scores').upsert({ seller_id: userId, score: 100, violation_count: 0 });
    // 通知
    await supabase.from('notifications').insert({ user_id: userId, type: 'seller_approved', target_type: 'seller_application', details: { message: '恭喜！您的商家入驻申请已通过审核。' } });
    loadApps();
  }

  async function rejectApp() {
    if (!rejectModal || !rejectReason.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('seller_applications').update({
      status: 'rejected', reject_reason: rejectReason, reviewed_by: user?.id, reviewed_at: new Date().toISOString(),
    }).eq('id', rejectModal.appId);
    await supabase.from('notifications').insert({ user_id: rejectModal.userId, type: 'seller_rejected', target_type: 'seller_application', details: { reason: rejectReason } });
    setRejectModal(null); setRejectReason(''); loadApps();
  }

  function viewImage(url: string) {
    if (url) window.open(url, '_blank');
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

                {/* 证件缩略图 */}
                {(app.id_card_front_url || app.id_card_back_url || app.business_license_url || app.health_cert_url) && (
                  <div className="flex gap-2 mt-1 mb-3 flex-wrap">
                    {app.id_card_front_url && (
                      <button onClick={() => viewImage(app.id_card_front_url)} className="group relative">
                        <img src={app.id_card_front_url} alt="身份证正面" className="h-16 w-auto max-w-[100px] rounded-lg object-cover border hover:ring-2 hover:ring-[#1a7f5a] transition" />
                        <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-black/60 text-white rounded-b-lg py-0.5">正面</span>
                      </button>
                    )}
                    {app.id_card_back_url && (
                      <button onClick={() => viewImage(app.id_card_back_url)} className="group relative">
                        <img src={app.id_card_back_url} alt="身份证反面" className="h-16 w-auto max-w-[100px] rounded-lg object-cover border hover:ring-2 hover:ring-[#1a7f5a] transition" />
                        <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-black/60 text-white rounded-b-lg py-0.5">反面</span>
                      </button>
                    )}
                    {app.business_license_url && (
                      <button onClick={() => viewImage(app.business_license_url)} className="group relative">
                        <img src={app.business_license_url} alt="营业执照" className="h-16 w-auto max-w-[100px] rounded-lg object-cover border hover:ring-2 hover:ring-[#1a7f5a] transition" />
                        <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-black/60 text-white rounded-b-lg py-0.5">执照</span>
                      </button>
                    )}
                    {app.health_cert_url && (
                      <button onClick={() => viewImage(app.health_cert_url)} className="group relative">
                        <img src={app.health_cert_url} alt="防疫证" className="h-16 w-auto max-w-[100px] rounded-lg object-cover border hover:ring-2 hover:ring-[#1a7f5a] transition" />
                        <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-black/60 text-white rounded-b-lg py-0.5">防疫</span>
                      </button>
                    )}
                    <p className="text-[10px] text-[#9ca3af] self-end">点击放大查看</p>
                  </div>
                )}

                {app.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => approveApp(app.id, app.user_id)}
                      className="rounded-full bg-[#1a7f5a] px-4 py-2 md:py-1.5 text-[13px] md:text-[12px] font-medium text-white hover:bg-[#166b4b] min-h-[44px] md:min-h-0 flex items-center">通过</button>
                    <button onClick={() => setRejectModal({ appId: app.id, userId: app.user_id })}
                      className="rounded-full border border-red-300 px-4 py-2 md:py-1.5 text-[13px] md:text-[12px] font-medium text-red-600 hover:bg-red-50 min-h-[44px] md:min-h-0 flex items-center">拒绝</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 拒绝原因弹窗 */}
      {rejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[90%] sm:max-w-md p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1f2937] mb-4">拒绝入驻申请</h3>
            <p className="text-[13px] text-[#6b7280] mb-3">请填写拒绝原因，申请者可修改后重新提交：</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
              placeholder="如：证件信息不清晰，请重新上传"
              className="w-full rounded-lg border px-3 py-2 text-[16px] outline-none focus:border-[#1a7f5a] resize-none mb-4" />
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <button onClick={() => setRejectModal(null)} className="flex-1 rounded-full border py-2.5 text-[13px] min-h-[44px]">取消</button>
              <button onClick={rejectApp} disabled={!rejectReason.trim()}
                className="flex-1 rounded-full bg-red-500 py-2.5 text-[13px] font-medium text-white disabled:opacity-50 min-h-[44px]">确认拒绝</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
