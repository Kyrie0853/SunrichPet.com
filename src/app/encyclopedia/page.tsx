import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '宠物品种百科 | 给我爬',
  description: '全面了解宠物品种：守宫、蛇类、龟类、观赏鱼、猫、狗、鸟类品种百科，含学名、饲养难度、原产地等详细信息。',
  keywords: '宠物品种,守宫品种,宠物蛇品种,龟类品种,观赏鱼品种,猫品种,狗品种,鸟品种,饲养难度,品种百科',
};

const species = [
  { slug: 'leopard-gecko', name: '豹纹守宫', latin: 'Eublepharis macularius', category: '守宫', difficulty: 2, origin: '巴基斯坦/印度', desc: '最受欢迎的入门宠物之一，性格温顺、体型适中、饲养简单。', color: '#f0a04b' },
  { slug: 'crested-gecko', name: '睫角守宫', latin: 'Correlophus ciliatus', category: '守宫', difficulty: 2, origin: '新喀里多尼亚', desc: '无需UVB灯，可喂食专用果泥饲料，非常适合新手。', color: '#e8795e' },
  { slug: 'gargoyle-gecko', name: '盖勾亚守宫', latin: 'Rhacodactylus auriculatus', category: '守宫', difficulty: 3, origin: '新喀里多尼亚', desc: '独特的外观和花纹变化，适合有一定经验的饲养者。', color: '#8b5cf6' },
  { slug: 'corn-snake', name: '玉米蛇', latin: 'Pantherophis guttatus', category: '蛇类', difficulty: 2, origin: '北美', desc: '最受欢迎的宠物蛇品种之一，色彩丰富、性格温顺、饲养简单。', color: '#e8793e' },
  { slug: 'red-eared-slider', name: '巴西龟', latin: 'Trachemys scripta elegans', category: '龟类', difficulty: 1, origin: '北美', desc: '最常见的宠物龟，适应性强，但需要充足的阳光和清洁的水质。', color: '#4d8c5e' },
  { slug: 'russian-tortoise', name: '四爪陆龟', latin: 'Testudo horsfieldii', category: '龟类', difficulty: 3, origin: '中亚', desc: '体型较小的陆龟，适合室内饲养，但需要特定的温湿度环境。', color: '#6b8e4e' },
  { slug: 'betta', name: '泰国斗鱼', latin: 'Betta splendens', category: '鱼类', difficulty: 1, origin: '东南亚', desc: '色彩艳丽、饲养简单，适合桌面小型鱼缸，是入门观赏鱼首选。', color: '#3b82f6' },
  { slug: 'axolotl', name: '墨西哥钝口螈', latin: 'Ambystoma mexicanum', category: '两栖', difficulty: 3, origin: '墨西哥', desc: '独特的六角恐龙，需要低温水质，对饲养环境要求较高。', color: '#ec4899' },
];

const categories = ['全部', '守宫', '蛇类', '龟类', '鱼类', '猫类', '狗类', '鸟类', '小宠'];

export default function EncyclopediaPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-3">宠物品种百科</h1>
        <p className="text-[#6b7280] text-[15px] md:text-lg">全面了解各类宠物品种——学名、饲养难度、原产地、特征介绍</p>
      </div>

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {categories.map(cat => (
          <Link key={cat} href={cat === '全部' ? '/encyclopedia' : '/encyclopedia?cat=' + cat}
            className="rounded-full border border-[#d1d5db] px-4 py-1.5 text-[13px] font-medium text-[#6b7280] hover:border-[#1a7f5a] hover:text-[#1a7f5a] transition-colors">
            {cat}
          </Link>
        ))}
      </div>

      {/* 品种网格 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {species.map(s => (
          <Link key={s.slug} href={'/encyclopedia/' + s.slug}
            className="group bg-white rounded-xl shadow-sm border border-[#f3f4f6] p-5 hover:shadow-md hover:border-[#1a7f5a]/20 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] bg-[#e8f5ef] text-[#1a7f5a] rounded-full px-2 py-0.5 font-medium">{s.category}</span>
              <span className="text-[11px] text-[#f0a04b]">{'⭐'.repeat(s.difficulty)}{'☆'.repeat(5 - s.difficulty)}</span>
            </div>
            <h3 className="text-[15px] font-bold text-[#1f2937] group-hover:text-[#1a7f5a] transition-colors">{s.name}</h3>
            <p className="text-[12px] text-[#9ca3af] italic mt-0.5">{s.latin}</p>
            <p className="text-[13px] text-[#6b7280] mt-2 line-clamp-2">{s.desc}</p>
            <p className="text-[11px] text-[#9ca3af] mt-2">🌍 {s.origin}</p>
          </Link>
        ))}
      </div>

      <p className="text-center text-[11px] text-[#d1d5db] mt-12">内容由给我爬整理，转载请注明出处</p>
    </div>
  );
}