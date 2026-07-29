import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: '品种百科 | 给我爬',
  description: '全面了解100+种爬宠品种：守宫、蛇类、龟类、蜥蜴、两栖、节肢等，含学名、饲养难度、原产地。',
};

const FALLBACK_CATEGORIES = ['全部', '守宫', '蛇类', '龟类', '蜥蜴', '两栖', '节肢', '小宠'];

export default async function EncyclopediaPage() {
  let species: any[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('encyclopedia_species')
      .select('*')
      .order('category')
      .order('name');
    species = data || [];
  } catch {
    // 数据库不可用时显示空状态
    species = [];
  }

  // 按分类分组获取分类列表
  const categories = FALLBACK_CATEGORIES;
  const dbCategories = [...new Set(species.map((s: any) => s.category))];
  const allCategories = dbCategories.length > 0 ? ['全部', ...dbCategories] : categories;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-3">品种百科</h1>
        <p className="text-[#6b7280] text-[15px] md:text-lg">
          全面了解 {species.length > 0 ? `${species.length}+` : ''} 种爬宠品种——学名、饲养难度、原产地、特征介绍
        </p>
      </div>

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {allCategories.map(cat => (
          <Link key={cat} href={cat === '全部' ? '/encyclopedia' : `/encyclopedia?cat=${encodeURIComponent(cat)}`}
            className="rounded-full border border-[#d1d5db] px-4 py-1.5 text-[13px] font-medium text-[#6b7280] hover:border-[#1a7f5a] hover:text-[#1a7f5a] transition-colors">
            {cat}
          </Link>
        ))}
      </div>

      {species.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-5xl mb-4">📚</p>
          <p className="text-[#9ca3af] text-[15px] mb-2">品种百科数据加载中</p>
          <p className="text-[#9ca3af] text-[13px]">
            请在 Supabase SQL Editor 中执行 <code className="bg-[#e8f5ef] px-1.5 py-0.5 rounded text-[#1a7f5a] text-[12px]">docs/seed-encyclopedia.sql</code>
          </p>
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

      <p className="text-center text-[11px] text-[#d1d5db] mt-12">内容由给我爬整理，转载请注明出处</p>
    </div>
  );
}