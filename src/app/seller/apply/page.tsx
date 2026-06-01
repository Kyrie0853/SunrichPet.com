'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = [
  '活体宠物-守宫', '活体宠物-龟类', '活体宠物-观赏鱼', '活体宠物-蛇类', '活体宠物-其他爬宠',
  '饲料', '器材', '造景', '药品',
];

export default function SellerApplyPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    realName: '', idNumber: '', phone: '',
    categories: [] as string[],
    province: '', city: '',
    commitment1: false, commitment2: false,
  });

  function update(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleCategory(cat: string) {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat],
    }));
  }

  async function handleSubmit() {
    setError('');
    if (!form.realName || !form.idNumber || !form.phone) {
      setError('请填写所有必填信息'); return;
    }
    if (form.categories.length === 0) {
      setError('请至少选择一个经营品类'); return;
    }
    if (!form.commitment1 || !form.commitment2) {
      setError('请勾选所有承诺书'); return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('请先登录'); setLoading(false); return; }

    // Check existing application
    const { data: existing } = await supabase.from('seller_applications').select('id,status').eq('user_id', user.id).maybeSingle();
    if (existing) {
      if (existing.status === 'approved') {
        setError('您已经是认证商家'); setLoading(false); return;
      }
      setError('您已提交过申请，请等待审核（状态：' + existing.status + '）');
      setLoading(false); return;
    }

    const { error: submitErr } = await supabase.from('seller_applications').insert({
      user_id: user.id,
      real_name: form.realName,
      id_number: form.idNumber,
      phone: form.phone,
      categories: form.categories,
      province: form.province,
      city: form.city,
      commitment_1_agreed: form.commitment1,
      commitment_2_agreed: form.commitment2,
      commitment_agreed_at: new Date().toISOString(),
    });

    if (submitErr) {
      setError('提交失败：' + submitErr.message);
      setLoading(false); return;
    }

    // Record agreement
    await supabase.from('user_agreements').insert([
      { user_id: user.id, agreement_type: 'seller_commitment_1' },
      { user_id: user.id, agreement_type: 'seller_commitment_2' },
    ]);

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-5xl mb-4">🎉</p>
        <h1 className="text-2xl font-bold text-[#1f2937] mb-2">申请已提交</h1>
        <p className="text-[#6b7280] mb-6">我们将在1-3个工作日内审核您的申请，请耐心等待。</p>
        <button onClick={() => router.push('/')} className="rounded-full bg-[#1a7f5a] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#166b4b]">返回首页</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-[#1f2937] mb-2">商家入驻申请</h1>
      <p className="text-[#6b7280] text-[14px] mb-8">填写以下信息，提交后等待平台审核</p>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-[13px] text-red-600">{error}</div>}

      {/* Step 1: 基本信息 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-4">
        <h2 className="text-[15px] font-semibold text-[#1f2937] mb-4">基本信息</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">真实姓名 *</label>
            <input type="text" value={form.realName} onChange={e => update('realName', e.target.value)}
              className="w-full h-10 rounded-lg border px-3 text-[14px] outline-none focus:border-[#1a7f5a]" placeholder="请输入真实姓名" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">身份证号 *</label>
            <input type="text" value={form.idNumber} onChange={e => update('idNumber', e.target.value)}
              className="w-full h-10 rounded-lg border px-3 text-[14px] outline-none focus:border-[#1a7f5a]" placeholder="请输入身份证号" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#4b5563] mb-1">手机号 *</label>
            <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
              className="w-full h-10 rounded-lg border px-3 text-[14px] outline-none focus:border-[#1a7f5a]" placeholder="请输入手机号" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-[#4b5563] mb-1">所在省份</label>
              <input type="text" value={form.province} onChange={e => update('province', e.target.value)}
                className="w-full h-10 rounded-lg border px-3 text-[14px] outline-none focus:border-[#1a7f5a]" placeholder="如：广东" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#4b5563] mb-1">所在城市</label>
              <input type="text" value={form.city} onChange={e => update('city', e.target.value)}
                className="w-full h-10 rounded-lg border px-3 text-[14px] outline-none focus:border-[#1a7f5a]" placeholder="如：广州" />
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: 经营品类 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-4">
        <h2 className="text-[15px] font-semibold text-[#1f2937] mb-4">经营品类（可多选）</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button key={cat} type="button" onClick={() => toggleCategory(cat)}
              className={'rounded-full px-4 py-1.5 text-[13px] font-medium transition ' +
                (form.categories.includes(cat) ? 'bg-[#1a7f5a] text-white' : 'border border-[#d1d5db] text-[#6b7280] hover:border-[#1a7f5a]')}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: 证件上传提示 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-4">
        <h2 className="text-[15px] font-semibold text-[#1f2937] mb-4">证件材料</h2>
        <div className="text-[13px] text-[#6b7280] space-y-2">
          <p>📷 身份证正反面照片（必需）</p>
          <p>📄 营业执照照片（企业卖家必需，个人卖家可选）</p>
          <p>🏥 防疫/养殖相关证件（活体宠物卖家必需）</p>
          <div className="mt-3 bg-[#fef3c7] rounded-lg p-3 text-[#92400e]">
            审核通过后，管理员会联系您补充上传证件照片。请确保联系方式畅通。
          </div>
        </div>
      </div>

      {/* Step 4: 承诺书 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-[15px] font-semibold text-[#1f2937] mb-4">开店承诺书</h2>
        <label className="flex items-start gap-2.5 mb-4 cursor-pointer">
          <input type="checkbox" checked={form.commitment1} onChange={e => update('commitment1', e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1a7f5a]" />
          <span className="text-[13px] text-[#4b5563]">我承诺不在平台外私下交易，所有交易通过平台担保完成</span>
        </label>
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" checked={form.commitment2} onChange={e => update('commitment2', e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1a7f5a]" />
          <span className="text-[13px] text-[#4b5563]">我承诺不售卖任何国家保护动物、濒危野生动物</span>
        </label>
      </div>

      <button onClick={handleSubmit} disabled={loading}
        className="w-full rounded-full bg-[#1a7f5a] py-3 text-[15px] font-semibold text-white hover:bg-[#166b4b] disabled:opacity-50 transition">
        {loading ? '提交中...' : '提交申请'}
      </button>

      <p className="text-center text-[12px] text-[#9ca3af] mt-4">
        提交即表示您已阅读并同意<Link href="/rules" className="text-[#1a7f5a]">《平台规则》</Link>
      </p>
    </div>
  );
}
