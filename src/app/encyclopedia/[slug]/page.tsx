import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let species: any = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('encyclopedia_species').select('*').eq('slug', slug).maybeSingle();
    species = data;
  } catch {}
  return {
    title: species ? `${species.name} — 品种百科 | 给我爬` : '品种百科 | 给我爬',
    description: species?.description?.slice(0, 160) || '爬宠品种百科详情',
  };
}

export default async function EncyclopediaDetailPage({ params }: Props) {
  const { slug } = await params;
  let species: any = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.from('encyclopedia_species').select('*').eq('slug', slug).maybeSingle();
    species = data;
  } catch {}

  if (!species) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-5xl mb-4">📚</p>
        <h1 className="text-2xl font-bold text-[#1f2937] mb-2">品种信息暂未收录</h1>
        <p className="text-[#6b7280] text-[14px] mb-2">该品种的详细资料正在整理中，敬请期待</p>
        <p className="text-[11px] text-[#9ca3af] mb-6 font-mono">slug: {slug}</p>
        <Link href="/encyclopedia" className="inline-block rounded-full bg-[#1a7f5a] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#166b4b] transition-colors">
          ← 返回百科
        </Link>
      </div>
    );
  }

  const difficultyStars = '⭐'.repeat(species.difficulty || 1) + '☆'.repeat(5 - (species.difficulty || 1));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/encyclopedia" prefetch={true} className="text-[13px] text-[#6b7280] hover:text-[#1a7f5a] mb-6 inline-block">&larr; 返回百科</Link>

      <div className="flex items-center gap-3 mb-2">
        <span className="text-[11px] bg-[#e8f5ef] text-[#1a7f5a] rounded-full px-3 py-1 font-medium">{species.category}</span>
        <span className="text-[12px] text-[#f0a04b]">{difficultyStars}</span>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-1">{species.name}</h1>
      <p className="text-[#9ca3af] italic mb-8 text-[14px]">{species.latin}</p>

      {/* 基本信息 */}
      <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] p-6 mb-8">
        <h2 className="text-lg font-bold text-[#1f2937] mb-4">📋 基本信息</h2>
        <div className="grid grid-cols-2 gap-y-3 text-[14px]">
          <div><span className="text-[#9ca3af]">原产地</span><p className="font-medium text-[#1f2937]">{species.origin}</p></div>
          <div><span className="text-[#9ca3af]">饲养难度</span><p className="font-medium text-[#1f2937]">{difficultyStars}</p></div>
          {species.size_cm && <div><span className="text-[#9ca3af]">体型</span><p className="font-medium text-[#1f2937]">{species.size_cm}</p></div>}
          {species.lifespan && <div><span className="text-[#9ca3af]">寿命</span><p className="font-medium text-[#1f2937]">{species.lifespan}</p></div>}
          {species.temp_min && species.temp_max && (
            <div><span className="text-[#9ca3af]">温度</span><p className="font-medium text-[#1f2937]">{species.temp_min}°C - {species.temp_max}°C</p></div>
          )}
          {species.humidity && <div><span className="text-[#9ca3af]">湿度</span><p className="font-medium text-[#1f2937]">{species.humidity}</p></div>}
        </div>
      </div>

      {/* 详细介绍 */}
      {species.description && (
        <div className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] p-6 mb-8">
          <h2 className="text-lg font-bold text-[#1f2937] mb-4">📝 品种介绍</h2>
          <p className="text-[15px] text-[#4b5563] leading-relaxed whitespace-pre-wrap">{species.description}</p>
        </div>
      )}

      {/* 饲养建议 */}
      <div className="bg-[#e8f5ef] rounded-xl border border-[#1a7f5a]/20 p-6 mb-8">
        <h3 className="text-[15px] font-bold text-[#1a7f5a] mb-3">💡 饲养提示</h3>
        <ul className="space-y-2 text-[14px] text-[#4b5563]">
          <li>• 请根据品种的温湿度要求准备合适的饲养环境</li>
          <li>• 新宠到家后建议静养 2-3 天再喂食</li>
          <li>• 定期清洁饲养箱，保持环境卫生</li>
          <li>• 发现异常行为及时咨询有经验的饲养者</li>
        </ul>
      </div>

      {/* 底部导航 */}
      <div className="flex flex-wrap gap-4 pt-6 border-t">
        <Link href="/encyclopedia" className="text-[13px] text-[#1a7f5a] hover:underline">← 返回品种百科</Link>
        <Link href="/shop" className="text-[13px] text-[#1a7f5a] hover:underline">查看在售个体 →</Link>
        <Link href="/guide" className="text-[13px] text-[#1a7f5a] hover:underline">新手指南 →</Link>
      </div>

      <p className="text-center text-[11px] text-[#d1d5db] mt-10">内容由给我爬整理，更新时间：{new Date(species.created_at).toLocaleDateString('zh-CN')}</p>
    </div>
  );
}
