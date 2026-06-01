'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { href: '/seller/dashboard', label: '首页', icon: '📊' },
  { href: '/seller/dashboard/products', label: '商品管理', icon: '📦' },
  { href: '/seller/dashboard/orders', label: '订单管理', icon: '📋' },
  { href: '/seller/dashboard/finance', label: '账目概览', icon: '💰' },
  { href: '/seller/dashboard/settings', label: '店铺设置', icon: '⚙️' },
];

export default function SellerSettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [shopNotice, setShopNotice] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [contactWechat, setContactWechat] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!p || (p.role !== 'seller' && p.role !== 'admin' && p.role !== 'super_admin')) { router.push('/seller/apply'); return; }
      setProfile(p);
      setDisplayName(p.display_name || '');
      setBio(p.bio || '');
      setShopNotice(p.shop_notice || '');
      setShippingAddress(p.shipping_address || '');
      setContactWechat(p.contact_wechat || '');
      setContactPhone(p.contact_phone || '');
      setAvatarPreview(p.avatar_url || '');
    }
    load();
  }, [supabase, router]);

  async function handleSave() {
    setSaving(true); setMessage('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let avatarUrl = avatarPreview;
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop() || 'jpg';
      const fileName = 'avatars/' + user.id + '-' + Date.now() + '.' + ext;
      const { error: upErr } = await supabase.storage.from('community-images').upload(fileName, avatarFile, { upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('community-images').getPublicUrl(fileName);
        avatarUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from('profiles').update({
      display_name: displayName, bio, avatar_url: avatarUrl,
      shop_notice: shopNotice, shipping_address: shippingAddress,
      contact_wechat: contactWechat, contact_phone: contactPhone,
    }).eq('id', user.id);

    if (error) { setMessage('保存失败: ' + error.message); } else { setMessage('✅ 保存成功'); }
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-10">
      <div className="flex flex-wrap gap-2 mb-6">
        {NAV.map(n => (<Link key={n.href} href={n.href} className={'rounded-full px-3 md:px-4 py-2 text-[13px] font-medium transition ' + (n.href.includes('/settings') ? 'bg-[#1a7f5a] text-white' : 'border border-[#d1d5db] text-[#6b7280] hover:border-[#1a7f5a]')}>{n.icon} {n.label}</Link>))}
      </div>

      <h2 className="text-lg font-bold text-[#1f2937] mb-6">店铺设置</h2>

      {message && <div className={'mb-4 rounded-lg p-3 text-[13px] ' + (message.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')}>{message}</div>}

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
        {/* 头像 */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-600 overflow-hidden shrink-0">
            {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : (displayName || 'U')[0]}
          </div>
          <div>
            <p className="text-[14px] font-medium text-[#1f2937]">店铺头像</p>
            <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); } }} className="mt-1 text-[13px]" />
          </div>
        </div>

        <div><label className="block text-[13px] font-medium text-[#4b5563] mb-1">店铺名称</label><input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" placeholder="你的店铺名称" /></div>

        <div><label className="block text-[13px] font-medium text-[#4b5563] mb-1">店铺简介</label><textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} className="w-full rounded-lg border px-3 py-2 text-[16px] outline-none focus:border-[#1a7f5a] resize-none" placeholder="简短介绍你的店铺" /></div>

        <div><label className="block text-[13px] font-medium text-[#4b5563] mb-1">店铺公告</label><textarea value={shopNotice} onChange={e => setShopNotice(e.target.value)} rows={3} className="w-full rounded-lg border px-3 py-2 text-[16px] outline-none focus:border-[#1a7f5a] resize-none" placeholder="显示在店铺主页顶部的公告（如营业时间、发货说明等）" /></div>

        <div><label className="block text-[13px] font-medium text-[#4b5563] mb-1">发货地址</label><input value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" placeholder="省/市/区 + 详细地址" /></div>

        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-[13px] font-medium text-[#4b5563] mb-1">微信（选填）</label><input value={contactWechat} onChange={e => setContactWechat(e.target.value)} className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" placeholder="微信号" /></div>
          <div><label className="block text-[13px] font-medium text-[#4b5563] mb-1">手机号（选填）</label><input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full h-11 rounded-lg border px-3 text-[16px] outline-none focus:border-[#1a7f5a]" placeholder="手机号" /></div>
        </div>
        <p className="text-[11px] text-[#f0a04b]">⚠️ 联系方式仅供买家咨询使用，禁止引导线下交易</p>

        <button onClick={handleSave} disabled={saving}
          className="w-full rounded-full bg-[#1a7f5a] py-3 text-[15px] font-semibold text-white hover:bg-[#166b4b] min-h-[44px]">{saving ? '保存中...' : '保存设置'}</button>
      </div>
    </div>
  );
}
