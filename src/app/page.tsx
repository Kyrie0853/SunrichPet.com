import Link from "next/link";
import { getSpeciesCategories, type SpeciesCategory } from "@/lib/studio/products";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "给我爬 — 个人爬宠工作室直营商城",
  description: "给我爬 · 个人爬宠工作室直营商城。专注高品质爬宠繁育，支付宝担保交易，每一只都是亲手养大的宝贝。",
  openGraph: {
    title: "给我爬",
    description: "专注高品质爬宠繁育，每一只都是亲手养大的宝贝",
    type: "website",
  },
};

export default async function HomePage() {
  const categories = await getSpeciesCategories();

  return (
    <div className="mx-auto max-w-5xl px-3 md:px-4">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a7f5a] via-emerald-600 to-teal-700 mb-8 mt-6 p-6 md:p-10 text-white">
        <div className="relative z-10">
          <p className="text-emerald-200/80 text-[13px] md:text-[14px] font-medium tracking-wide uppercase mb-2">
            个人爬宠工作室直营商城
          </p>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight">
            给我爬
          </h1>
          <p className="mt-3 text-emerald-100/90 text-[14px] md:text-[16px] leading-relaxed max-w-lg">
            专注高品质爬宠繁育，每一只都是亲手养大的宝贝。支付宝担保交易，安心选购。
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 hidden md:block">
          <svg viewBox="0 0 200 200" className="h-full w-full" fill="white">
            <circle cx="150" cy="30" r="60" />
            <circle cx="170" cy="100" r="40" />
            <circle cx="130" cy="160" r="50" />
          </svg>
        </div>
      </section>

      {/* ===== 担保交易标识 ===== */}
      <div className="mb-8">
        <div className="rounded-xl border border-[#1a7f5a]/20 bg-[#e8f5ef] px-4 py-2.5 text-[13px] text-[#1a7f5a] font-medium">
          🛡️ 支付宝担保交易 · 收货验货后付款
        </div>
      </div>

      {/* ===== 分类卡片 ===== */}
      <section className="mb-12">
        <h2 className="text-lg md:text-xl font-bold text-[#1f2937] mb-5 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#1a7f5a] rounded-full inline-block"></span>
          全部爬宠分类
        </h2>

        {categories.filter(c => c.count > 0).length === 0 ? (
          <div className="py-12 text-center rounded-xl bg-gradient-to-b from-[#f0faf5] to-white border border-dashed border-[#1a7f5a]/30">
            <p className="text-5xl mb-4">🦎</p>
            <p className="text-[#1f2937] text-[16px] font-medium mb-2">即将上架，敬请期待</p>
            <p className="text-[#9ca3af] text-[13px] mb-4">首批高品质爬宠正在精心准备中</p>
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map(c => (
                <span key={c.species} className="rounded-full bg-[#e8f5ef] px-3 py-1 text-[12px] font-medium text-[#1a7f5a]">
                  {c.species}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.species}
                href={`/shop?category=${encodeURIComponent(cat.slug)}`}
                className="group bg-white rounded-2xl border border-[#f3f4f6] overflow-hidden hover:shadow-lg hover:border-[#1a7f5a]/30 transition-all duration-300"
              >
                {/* 分类图片 */}
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                  {cat.firstImage ? (
                    <img
                      src={cat.firstImage}
                      alt={cat.species}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-6xl text-gray-300">🦎</div>
                  )}
                  {/* 渐变遮罩 */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
                  {/* 数量标签 */}
                  <span className="absolute bottom-3 left-3 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-medium text-[#1a7f5a]">
                    {cat.count} 只在售
                  </span>
                </div>
                {/* 分类名称 */}
                <div className="p-4">
                  <h3 className="text-[16px] font-semibold text-[#1f2937] group-hover:text-[#1a7f5a] transition-colors">
                    {cat.species}
                  </h3>
                  <div className="mt-2 flex items-center text-[13px] text-[#1a7f5a] font-medium">
                    查看全部
                    <svg className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===== 工作室信息 ===== */}
      <section className="mb-12 rounded-2xl bg-white border border-[#f3f4f6] p-5 md:p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <h3 className="text-[14px] font-semibold text-[#1f2937] mb-2">联系方式</h3>
            <p className="text-[13px] text-[#6b7280] leading-relaxed">
              邮箱：553043978@qq.com<br />工作时间：9:00-21:00<br />所有交易请通过支付宝担保完成
            </p>
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-[#1f2937] mb-2">担保交易说明</h3>
            <p className="text-[13px] text-[#6b7280] leading-relaxed">
              本店所有交易通过支付宝担保交易<br />付款 → 发货 → 验货 → 确认收货<br />杜绝私下转账，保障双方权益
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}