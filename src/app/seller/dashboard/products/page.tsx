'use client';

import { useState, useEffect, useCallback } from 'react';
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

export default function SellerProductsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', category_id: '', status: 'active', species: '', size_weight: '', age_info: '', gender: '', shipping_regions: '', live_arrival_policy: '', defect_notes: '', is_live_pet: false });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }
    const { data } = await supabase.from('products').select('*').eq('seller_id', user.id).order('created_at', { ascending: false });
    setProducts(data || []);
    const { data: cats } = await supabase.from('categories').select('*').order('sort_order');
    setCategories(cats || []);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  function openForm(p?: any) {
    if (p) {
      setEditId(p.id);
      setForm({ name: p.name || '', description: p.description || '', price: String(p.price || ''), stock: String(p.stock || ''), category_id: p.category_id || '', status: p.status || 'active', species: p.species || '', size_weight: p.size_weight || '', age_info: p.age_info || '', gender: p.gender || '', shipping_regions: (p.shipping_regions || []).join(','), live_arrival_policy: p.live_arrival_policy || '', defect_notes: p.defect_notes || '', is_live_pet: p.is_live_pet || false });
      if (p.images?.length) setImagePreviews(p.images);
    } else {
      setEditId(null);
      setForm({ name: '', description: '', price: '', stock: '', category_id: '', status: 'active', species: '', size_weight: '', age_info: '', gender: '', shipping_regions: '', live_arrival_policy: '', defect_notes: '', is_live_pet: false });
      setImages([]);
      setImagePreviews([]);
    }
    setShowForm(true);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (!form.name || !form.price || !form.category_id) { setError('请填写商品名称、价格和分类'); return; }
    if (form.is_live_pet && !form.species) { setError('活体商品请填写品种'); return; }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upload images
    const uploadedUrls: string[] = [...imagePreviews.filter(u => u.startsWith('http'))];
    for (const file of images.slice(0, 5)) {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = user.id + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
      const { error: upErr } = await supabase.storage.from('community-images').upload(fileName, file);
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('community-images').getPublicUrl(fileName);
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    const payload = {
      seller_id: user.id,
      name: form.name, description: form.description,
      price: parseFloat(form.price), stock: parseInt(form.stock) || 0,
      category_id: form.category_id, status: form.status,
      images: uploadedUrls, image_url: uploadedUrls[0] || '',
      slug: form.name.toLowerCase().replace(/[^a-z0-9一-鿿]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now(),
      species: form.species, size_weight: form.size_weight, age_info: form.age_info,
      gender: form.gender || null, shipping_regions: form.shipping_regions ? form.shipping_regions.split(',').map(s => s.trim()) : [],
      live_arrival_policy: form.live_arrival_policy, defect_notes: form.defect_notes,
      is_live_pet: form.is_live_pet,
    };

    let result;
    if (editId) {
      result = await supabase.from('products').update(payload).eq('id', editId);
    } else {
      result = await supabase.from('products').insert(payload);
    }
    if (result.error) { setError('保存失败: ' + result.error.message); setSubmitting(false); return; }
    setShowForm(false); setSubmitting(false); loadProducts();
  }

  async function toggleStatus(id: string, current: string) {
    await supabase.from('products').update({ status: current === 'active' ? 'inactive' : 'active' }).eq('id', id);
    loadProducts();
  }

  async function deleteProduct(id: string) {
    if (!confirm('确定删除该商品？')) return;
    await supabase.from('products').delete().eq('id', id);
    loadProducts();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      {/* 导航 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {NAV.map(n => (
          <Link key={n.href} href={n.href} className={'rounded-full px-3 md:px-4 py-2 text-[13px] font-medium transition ' + (n.href.includes('/products') ? 'bg-[#1a7f5a] text-white' : 'border border-[#d1d5db] text-[#6b7280] hover:border-[#1a7f5a]')}>{n.icon} {n.label}</Link>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#1f2937]">商品管理 ({products.length})</h2>
        <button onClick={() => openForm()} className="rounded-full bg-[#1a7f5a] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#166b4b] min-h-[44px]">+ 添加商品</button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-[13px] text-red-600">{error}</div>}

      {/* 表单弹窗 */}
      {showForm && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/40 flex items-start justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8 p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1f2937] mb-4">{editId ? '编辑商品' : '添加商品'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="block text-[12px] font-medium text-[#4b5563] mb-1">商品名称 *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full h-10 rounded-lg border px-3 text-[14px] outline-none focus:border-[#1a7f5a]" /></div>
                <div><label className="block text-[12px] font-medium text-[#4b5563] mb-1">价格 *</label><input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full h-10 rounded-lg border px-3 text-[14px] outline-none focus:border-[#1a7f5a]" /></div>
                <div><label className="block text-[12px] font-medium text-[#4b5563] mb-1">库存</label><input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full h-10 rounded-lg border px-3 text-[14px] outline-none focus:border-[#1a7f5a]" /></div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#4b5563] mb-1">分类 *</label>
                <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className="w-full h-10 rounded-lg border px-3 text-[14px] outline-none focus:border-[#1a7f5a]">
                  <option value="">选择分类</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="block text-[12px] font-medium text-[#4b5563] mb-1">描述</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full rounded-lg border px-3 py-2 text-[14px] outline-none focus:border-[#1a7f5a] resize-none" /></div>

              {/* 活体宠物额外字段 */}
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_live_pet} onChange={e => setForm({...form, is_live_pet: e.target.checked})} className="rounded" /><span className="text-[13px] font-medium text-[#4b5563]">活体宠物（需填写以下信息）</span></label>
              {form.is_live_pet && (
                <div className="space-y-3 bg-[#f9fafb] rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-[12px] font-medium text-[#4b5563] mb-1">品种 *</label><input value={form.species} onChange={e => setForm({...form, species: e.target.value})} className="w-full h-10 rounded-lg border px-3 text-[14px] outline-none focus:border-[#1a7f5a]" placeholder="如：高黄豹纹守宫" /></div>
                    <div><label className="block text-[12px] font-medium text-[#4b5563] mb-1">大小/体重</label><input value={form.size_weight} onChange={e => setForm({...form, size_weight: e.target.value})} className="w-full h-10 rounded-lg border px-3 text-[14px] outline-none focus:border-[#1a7f5a]" placeholder="如：15cm/30g" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-[12px] font-medium text-[#4b5563] mb-1">年龄/孵化日期</label><input value={form.age_info} onChange={e => setForm({...form, age_info: e.target.value})} className="w-full h-10 rounded-lg border px-3 text-[14px] outline-none focus:border-[#1a7f5a]" placeholder="如：3个月" /></div>
                    <div><label className="block text-[12px] font-medium text-[#4b5563] mb-1">性别</label><select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full h-10 rounded-lg border px-3 text-[14px] outline-none focus:border-[#1a7f5a]"><option value="">未知</option><option value="male">公</option><option value="female">母</option></select></div>
                  </div>
                  <div><label className="block text-[12px] font-medium text-[#4b5563] mb-1">发货范围（省份逗号分隔）</label><input value={form.shipping_regions} onChange={e => setForm({...form, shipping_regions: e.target.value})} className="w-full h-10 rounded-lg border px-3 text-[14px] outline-none focus:border-[#1a7f5a]" placeholder="广东,广西,福建" /></div>
                  <div><label className="block text-[12px] font-medium text-[#4b5563] mb-1">包活规则</label><input value={form.live_arrival_policy} onChange={e => setForm({...form, live_arrival_policy: e.target.value})} className="w-full h-10 rounded-lg border px-3 text-[14px] outline-none focus:border-[#1a7f5a]" placeholder="如：开箱验货，24小时内提供开箱视频，死亡包赔" /></div>
                  <div><label className="block text-[12px] font-medium text-[#4b5563] mb-1">瑕疵说明</label><input value={form.defect_notes} onChange={e => setForm({...form, defect_notes: e.target.value})} className="w-full h-10 rounded-lg border px-3 text-[14px] outline-none focus:border-[#1a7f5a]" placeholder="如：尾部轻微弯曲" /></div>
                  <p className="text-[11px] text-[#f0a04b]">📸 活体商品请至少上传3张不同角度的实拍照片</p>
                </div>
              )}

              {/* 图片上传 */}
              <div>
                <label className="block text-[12px] font-medium text-[#4b5563] mb-1">商品图片（{form.is_live_pet ? '至少3张' : ''}实拍照片）</label>
                <input type="file" accept="image/*" multiple onChange={e => { const fs = Array.from(e.target.files || []); setImages(fs); setImagePreviews(fs.map(f => URL.createObjectURL(f))); }} className="w-full text-[13px]" />
                {imagePreviews.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{imagePreviews.map((url, i) => <img key={i} src={url} className="h-16 w-16 rounded-lg object-cover" />)}</div>}
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-full border py-2.5 text-[13px] text-[#6b7280] min-h-[44px]">取消</button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-full bg-[#1a7f5a] py-2.5 text-[13px] font-medium text-white min-h-[44px]">{submitting ? '保存中...' : '保存商品'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 商品列表 */}
      {loading ? <div className="text-center py-12 text-[#9ca3af]">加载中...</div> :
        products.length === 0 ? <div className="text-center py-12 text-[#9ca3af]">暂无商品，点击上方按钮添加</div> :
        <>
          {/* 移动端卡片 */}
          <div className="md:hidden space-y-2.5">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-xl border p-3">
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0">{p.image_url ? <img src={p.image_url} className="w-full h-full rounded-lg object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">📦</div>}</div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-[14px] truncate">{p.name}</h4>
                    <p className="text-[#1a7f5a] font-bold">¥{p.price}</p>
                    <p className="text-[11px] text-[#9ca3af]">库存 {p.stock} · {p.status === 'active' ? '在售' : '已下架'}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 pt-2 border-t">
                  <button onClick={() => openForm(p)} className="flex-1 rounded-full border py-2 text-[12px] text-[#6b7280] min-h-[44px]">编辑</button>
                  <button onClick={() => toggleStatus(p.id, p.status)} className="flex-1 rounded-full border py-2 text-[12px] min-h-[44px]">{p.status === 'active' ? '下架' : '上架'}</button>
                  <button onClick={() => deleteProduct(p.id)} className="flex-1 rounded-full border py-2 text-[12px] text-red-500 min-h-[44px]">删除</button>
                </div>
              </div>
            ))}
          </div>
          {/* 桌面端表格 */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="table-responsive">
              <table className="w-full text-[13px]">
                <thead><tr className="border-b bg-[#f9fafb]"><th className="text-left px-4 py-3">商品</th><th className="text-left px-4 py-3">价格</th><th className="text-left px-4 py-3">库存</th><th className="text-left px-4 py-3">状态</th><th className="text-right px-4 py-3">操作</th></tr></thead>
                <tbody>{products.map(p => (
                  <tr key={p.id} className="border-b hover:bg-[#f9fafb]">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded bg-gray-100">{p.image_url ? <img src={p.image_url} className="w-full h-full rounded object-cover" /> : <span className="text-gray-400 text-[10px]">📦</span>}</div><span className="font-medium truncate max-w-[200px]">{p.name}</span></div></td>
                    <td className="px-4 py-3 font-medium text-[#1a7f5a]">¥{p.price}</td>
                    <td className="px-4 py-3">{p.stock}</td>
                    <td className="px-4 py-3"><span className={'rounded-full px-2 py-0.5 text-[11px] font-medium ' + (p.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500')}>{p.status === 'active' ? '在售' : '已下架'}</span></td>
                    <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => openForm(p)} className="rounded-full px-2.5 py-1 text-[11px] text-[#6b7280] hover:bg-[#f3f4f6]">编辑</button><button onClick={() => toggleStatus(p.id, p.status)} className="rounded-full px-2.5 py-1 text-[11px] hover:bg-[#f3f4f6]">{p.status === 'active' ? '下架' : '上架'}</button><button onClick={() => deleteProduct(p.id)} className="rounded-full px-2.5 py-1 text-[11px] text-red-500 hover:bg-red-50">删除</button></div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>
      }
    </div>
  );
}
