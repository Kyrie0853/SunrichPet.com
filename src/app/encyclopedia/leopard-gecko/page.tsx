import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '豹纹守宫 — 品种百科 | 顺瑞益宠',
  description: '豹纹守宫（Eublepharis macularius）品种百科：学名、原产地、成体尺寸、寿命、温度湿度要求、饲养要点、性格特点。',
  keywords: '豹纹守宫,Leopard Gecko,守宫饲养,爬宠品种,豹纹守宫温度,豹纹守宫喂食',
};

export default function LeopardGeckoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/encyclopedia" className="text-[13px] text-[#6b7280] hover:text-[#1a7f5a] mb-4 inline-block">&larr; 返回百科</Link>
      <h1 className="text-3xl font-bold text-[#1f2937] mb-2">豹纹守宫</h1>
      <p className="text-[#9ca3af] italic mb-8">Eublepharis macularius · Leopard Gecko</p>

      {/* 信息表 */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-bold mb-4">📋 基本信息</h2>
        <div className="grid grid-cols-2 gap-y-3 text-[14px]">
          <div><span className="text-[#9ca3af]">学名</span><p className="font-medium">Eublepharis macularius</p></div>
          <div><span className="text-[#9ca3af]">原产地</span><p className="font-medium">巴基斯坦、印度、阿富汗</p></div>
          <div><span className="text-[#9ca3af]">成体尺寸</span><p className="font-medium">18-25cm</p></div>
          <div><span className="text-[#9ca3af]">寿命</span><p className="font-medium">10-20年</p></div>
          <div><span className="text-[#9ca3af]">温度</span><p className="font-medium">热区 32-35°C / 冷区 24-26°C</p></div>
          <div><span className="text-[#9ca3af]">湿度</span><p className="font-medium">30-40%（蜕皮时提高至60%）</p></div>
          <div><span className="text-[#9ca3af]">饲养难度</span><p className="font-medium text-[#f0a04b]">⭐⭐☆☆☆ 简单</p></div>
          <div><span className="text-[#9ca3af]">食性</span><p className="font-medium">昆虫食性（蟋蟀、面包虫、蟑螂）</p></div>
        </div>
      </div>

      {/* 饲养要点 */}
      <div className="prose max-w-none space-y-6 text-[15px] leading-relaxed text-[#4b5563]">
        <section>
          <h3 className="text-xl font-bold text-[#1f2937] mb-3">🏠 饲养箱选择</h3>
          <p>成体豹纹守宫推荐使用 60×40×30cm 的饲养箱。幼体可使用较小的饲养箱（30×20×15cm），太大的空间会让幼体感到不安。豹纹守宫是地栖型守宫，不需要太高的饲养箱，但需要足够的底面积供其活动。</p>
          <p>垫材推荐使用厨房纸巾（幼体）、爬宠地毯或瓷砖。避免使用松散的沙粒垫材，以免误食导致肠梗阻。</p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-[#1f2937] mb-3">🌡️ 温度与湿度</h3>
          <p>豹纹守宫需要温度梯度：热区（加热垫上方）32-35°C，冷区 24-26°C。使用温控器精确控制加热垫温度，防止烫伤。夜间温度可降至 20-22°C。</p>
          <p>湿度保持在 30-40% 即可。在饲养箱中放置一个湿润的躲避穴（蜕皮屋），帮助蜕皮。蜕皮期间将湿度提高至 60% 左右。</p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-[#1f2937] mb-3">🍽️ 喂食频率</h3>
          <p>幼体每天喂食 2-3 只小蟋蟀或面包虫。亚成体隔天喂食 3-5 只。成体每 2-3 天喂食 5-8 只。食物需沾钙粉和维生素 D3 粉末。每周提供 1-2 次含维生素的补充剂。</p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-[#1f2937] mb-3">🏥 常见疾病</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>代谢性骨病（MBD）</strong>：缺钙或缺乏维生素D3导致，表现为四肢无力、下颌变形。定期补充钙粉和UVB可预防。</li>
            <li><strong>肠梗阻</strong>：误食垫材或过大食物导致。使用安全的垫材和适当大小的食物。</li>
            <li><strong>蜕皮不全</strong>：湿度不足导致。提供湿润躲避穴，蜕皮不全时用温水浸泡辅助去除。</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold text-[#1f2937] mb-3">😊 性格特点</h3>
          <p>豹纹守宫性格温顺、容易驯化，是最适合新手的爬宠之一。它们通常不会咬人，经过一段时间适应后，可以轻松上手互动。每天花 5-10 分钟与守宫互动，有助于建立信任关系。</p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-[#1f2937] mb-3">👤 适合人群</h3>
          <p>豹纹守宫非常适合以下人群：爬宠新手、儿童（需家长监督）、空间有限的饲养者、喜欢温和互动的人。它们不需要太大的空间，饲养成本相对较低，且不需要 UVB 灯（但有 UVB 更好）。</p>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t flex gap-4">
        <Link href="/b/gecko" className="text-[13px] text-[#1a7f5a] hover:underline">社区相关帖子 →</Link>
        <Link href="/shop" className="text-[13px] text-[#1a7f5a] hover:underline">商城相关商品 →</Link>
      </div>

      <p className="text-center text-[11px] text-[#d1d5db] mt-10">内容由顺瑞益宠整理，转载请注明出处</p>
    </div>
  );
}