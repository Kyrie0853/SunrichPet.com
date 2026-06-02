'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
type DocFile = { file: File | null; preview: string | null };

const CATEGORIES = [
  '活体宠物-守宫', '活体宠物-龟类', '活体宠物-观赏鱼', '活体宠物-蛇类', '活体宠物-其他爬宠',
  '活体宠物-猫', '活体宠物-狗', '活体宠物-鸟',
  '猫咪用品', '狗狗用品', '鸟类用品',
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
    commitment2: false,
  });

  // File upload states
  const [idCardFront, setIdCardFront] = useState<DocFile>({ file: null, preview: null });
  const [idCardBack, setIdCardBack] = useState<DocFile>({ file: null, preview: null });
  const [bizLicense, setBizLicense] = useState<DocFile>({ file: null, preview: null });
  const [healthCert, setHealthCert] = useState<DocFile>({ file: null, preview: null });

  function update(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>, setter: (d: DocFile) => void) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) { setError('文件不能超过 5MB'); return; }
    if (!ALLOWED_TYPES.includes(file.type)) { setError('仅支持 JPG、PNG、WebP、PDF 格式'); return; }
    setError('');
    const preview = file.type === 'application/pdf' ? null : URL.createObjectURL(file);
    setter({ file, preview });
  }

  function clearFile(setter: (d: DocFile) => void, current: DocFile) {
    if (current.preview) URL.revokeObjectURL(current.preview);
    setter({ file: null, preview: null });
  }

  async function uploadFile(file: File, userId: string, prefix: string): Promise<string | null> {
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/${prefix}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('seller-documents')
      .upload(fileName, file, { contentType: file.type, upsert: true });
    if (upErr) { console.error('Upload failed:', upErr); return null; }
    const { data: urlData } = supabase.storage.from('seller-documents').getPublicUrl(fileName);
    return urlData.publicUrl;
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
    if (!idCardFront.file || !idCardBack.file) {
      setError('请上传身份证正反面照片'); return;
    }
    if (form.categories.length === 0) {
      setError('请至少选择一个经营品类'); return;
    }
    if (!form.commitment2) {
      setError('请勾选承诺书'); return;
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

    // Upload all files in parallel
    const [frontUrl, backUrl, bizUrl, healthUrl] = await Promise.all([
      uploadFile(idCardFront.file!, user.id, 'id-front'),
      uploadFile(idCardBack.file!, user.id, 'id-back'),
      bizLicense.file ? uploadFile(bizLicense.file, user.id, 'biz-license') : Promise.resolve(null),
      healthCert.file ? uploadFile(healthCert.file, user.id, 'health-cert') : Promise.resolve(null),
    ]);

    if (!frontUrl || !backUrl) {
      setError('证件上传失败，请检查网络后重试');
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
      commitment_1_agreed: false,
      commitment_2_agreed: form.commitment2,
      commitment_agreed_at: new Date().toISOString(),
      id_card_front_url: frontUrl,
      id_card_back_url: backUrl,
      business_license_url: bizUrl,
      health_cert_url: healthUrl,
    });

    if (submitErr) {
      setError('提交失败：' + submitErr.message);
      setLoading(false); return;
    }

    // Record agreement
    await supabase.from('user_agreements').insert([
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
        <p className="text-[#6b7280] mb-6">您的入驻申请已提交，管理员将在 1-3 个工作日内审核，请耐心等待。</p>
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

      {/* Step 3: 证件材料 — 直接上传 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-4">
        <h2 className="text-[15px] font-semibold text-[#1f2937] mb-4">证件材料</h2>

        <div className="bg-[#e8f5ef] rounded-lg p-3 text-[#1a7f5a] text-[13px] mb-5">
          请上传本人身份证正反面照片，用于平台实名认证。认证后您的店铺将获得「已认证」标识，买家更信任。您的信息仅供平台审核使用，绝不外泄。
        </div>

        {/* 身份证正面 */}
        <div className="mb-4">
          <label className="block text-[13px] font-medium text-[#4b5563] mb-1.5">身份证正面 <span className="text-red-400">*</span></label>
          <FileUploadBox doc={idCardFront} onChange={e => handleFile(e, setIdCardFront)} onClear={() => clearFile(setIdCardFront, idCardFront)} hint="点击或拖拽上传身份证人像面" />
        </div>

        {/* 身份证反面 */}
        <div className="mb-4">
          <label className="block text-[13px] font-medium text-[#4b5563] mb-1.5">身份证反面 <span className="text-red-400">*</span></label>
          <FileUploadBox doc={idCardBack} onChange={e => handleFile(e, setIdCardBack)} onClear={() => clearFile(setIdCardBack, idCardBack)} hint="点击或拖拽上传身份证国徽面" />
        </div>

        {/* 营业执照 */}
        <div className="mb-4">
          <label className="block text-[13px] font-medium text-[#4b5563] mb-1.5">营业执照</label>
          <FileUploadBox doc={bizLicense} onChange={e => handleFile(e, setBizLicense)} onClear={() => clearFile(setBizLicense, bizLicense)} hint="上传营业执照可提升店铺信誉（选填）" />
        </div>

        {/* 防疫/养殖证件 */}
        <div className="mb-4">
          <label className="block text-[13px] font-medium text-[#4b5563] mb-1.5">防疫/养殖相关证件</label>
          <FileUploadBox doc={healthCert} onChange={e => handleFile(e, setHealthCert)} onClear={() => clearFile(setHealthCert, healthCert)} hint="如涉及活体宠物销售，建议上传相关证件（选填）" />
        </div>
      </div>

      {/* Step 4: 承诺书 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-[15px] font-semibold text-[#1f2937] mb-4">开店承诺书</h2>
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

// Reusable file upload box
function FileUploadBox({ doc, onChange, onClear, hint }: {
  doc: DocFile;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      {doc.file ? (
        <div className="rounded-xl border border-[#1a7f5a]/30 bg-[#f9fafb] p-3">
          <div className="flex items-start gap-3">
            {doc.preview ? (
              <img src={doc.preview} alt="preview" className="h-20 w-auto max-w-[140px] rounded-lg object-cover border" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 text-2xl">📄</div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-[#1f2937] truncate">{doc.file.name}</p>
              <p className="text-[11px] text-[#9ca3af] mt-0.5">{(doc.file.size / 1024).toFixed(0)} KB</p>
              <button type="button" onClick={onClear} className="mt-1.5 text-[11px] text-red-500 hover:underline">移除</button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d1d5db] bg-[#f9fafb] px-4 py-5 text-center transition hover:border-[#1a7f5a] hover:bg-[#e8f5ef]/50"
        >
          <svg className="mb-1.5 h-7 w-7 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
          <p className="text-[13px] text-[#6b7280]">{hint}</p>
          <p className="text-[11px] text-[#9ca3af] mt-0.5">JPG / PNG / WebP / PDF · 最大 5MB</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={onChange} className="hidden" />
    </>
  );
}
