import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: '品种百科 | 给我爬',
  description: '全面了解100+种爬宠品种：守宫、蛇类、龟类、蜥蜴、两栖、节肢等，含学名、饲养难度、原产地。',
};

type Props = { searchParams: Promise<{ cat?: string }> };

export default async function EncyclopediaPage({ searchParams }: Props) {
  const { cat: activeCat } = await searchParams;

  let species: any[] = [];
  try {
    const supabase = await createClient();
    let query = supabase.from('encyclopedia_species').select('*');
    if (activeCat && activeCat !== '全部') {
      query = query.eq('category', activeCat);
    }
    const { data } = await query.order('category').order('name');
    species = data || [];
  } catch {
    species = [];
  }

  const dbCategories = [...new Set((species || []).map((s: any) => s.category))];
  const allCategories = dbCategories.length > 0 ? dbCategories : [];

  // Get full category list for tabs (from all data, not filtered)
  let allSpecies: any[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('encyclopedia_species').select('category');
    allSpecies = data || [];
  } catch {}
  const allCats = ['全部', ...new Set(allSpecies.map((s: any) => s.category))];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-3">品种百科</h1>
        <p className="text-[#6b7280] text-[15px] md:text-lg">
          全面了解 100+ 种爬宠品种——学名、饲养难度、原产地、特征介绍
        </p>
        {activeCat && activeCat !== '全部' && (
          <p className="text-[13px] text-[#1a7f5a] mt-2">
            当前筛选：{activeCat} · {species.length} 个品种
          </p>
        )}
      </div>

      {/* 分类筛选标签 - 横向可滚动 */}
      <div className="mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:justify-center md:flex-wrap">
          {allCats.map(cat => {
            const isActive = cat === (activeCat || '全部');
            return (
              <Link
                key={cat}
                href={cat === '全部' ? '/encyclopedia' : `/encyclopedia?cat=${encodeURIComponent(cat)}`}
                prefetch={true}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-[#1a7f5a] text-white shadow-sm'
                    : 'border border-[#d1d5db] text-[#6b7280] hover:border-[#1a7f5a] hover:text-[#1a7f5a] bg-white'
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>
      </div>

      {species.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-5xl mb-4">📚</p>
          <p className="text-[#9ca3af] text-[15px] mb-2">
            {activeCat ? `"${activeCat}"分类下暂无品种数据` : '品种百科数据加载中'}
          </p>
          <p className="text-[#9ca3af] text-[13px]">
            请在 Supabase SQL Editor 中执行 <code className="bg-[#e8f5ef] px-1.5 py-0.5 rounded text-[#1a7f5a] text-[12px]">docs/seed-encyclopedia.sql</code>
          </p>
          {activeCat && (
            <Link href="/encyclopedia" className="inline-block mt-4 text-[13px] text-[#1a7f5a] hover:underline">← 查看全部品种</Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {species.map((s: any) => (
            <Link key={s.slug} href={'/encyclopedia/' + s.slug}
              prefetch={true}
              className="group bg-white rounded-xl shadow-sm border border-[#f3f4f6] p-5 hover:shadow-md hover:border-[#1a7f5a]/20 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] bg-[#e8f5ef] text-[#1a7f5a] rounded-full px-2 py-0.5 font-medium">{s.category}</span>
                <span className="text-[11px] text-[#f0a04b]">{'⭐'.repeat(s.difficulty || 1)}{'☆'.repeat(5 - (s.difficulty || 1))}</span>
              </div>
              <h3 className="text-[15px] font-bold text-[#1f2937] group-hover:text-[#1a7f5a] transition-colors">{s.name}</h3>
              <p className="text-[12px] text-[#9ca3af] italic mt-0.5">{s.latin}</p>
              <p className="text-[13px] text-[#6b7280] mt-2 line-clamp-2">{s.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-[11px] text-[#9ca3af]">🌍 {s.origin}</p>
                {s.size_cm && <p className="text-[11px] text-[#9ca3af]">📏 {s.size_cm}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {species.length > 0 && (
        <p className="text-center text-[11px] text-[#d1d5db] mt-12">
          共 {species.length} 个品种 · 内容由给我爬整理
        </p>
      )}
    </div>
  );
}