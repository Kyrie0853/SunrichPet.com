import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '关于我们 — 顺瑞益宠',
  description: '顺瑞益宠 — 全国宠物玩家的聚集地。了解我们的品牌故事、平台特色，加入最温暖的宠物社区。',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 py-10 md:py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-3">
          关于顺瑞益宠
        </h1>
        <p className="text-[#6b7280] text-[15px] md:text-lg">
          全国宠物玩家的聚集地
        </p>
      </div>

      {/* 品牌故事 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#1f2937] mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-[#1a7f5a] rounded-full inline-block"></span>
          品牌故事
        </h2>
        <p className="text-[15px] text-[#4b5563] leading-relaxed">
          顺瑞益宠创立于 2026 年，致力于打造一个专业、可信、有温度的宠物玩家社区和交易平台。
          在这里，你可以找到志同道合的宠友，分享养宠经验，也可以放心购买心仪的宠物。
        </p>
      </section>

      {/* 平台特色 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#1f2937] mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-[#1a7f5a] rounded-full inline-block"></span>
          平台特色
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: '🛡️', title: '平台担保交易', desc: '资金托管，收货验货后再结算，保障买卖双方权益' },
            { icon: '🏘️', title: '垂直兴趣社区', desc: '守宫、蛇类、龟友、观赏鱼、猫、狗、鸟等多个社区，精准找到同好' },
            { icon: '⭐', title: '真实用户评价', desc: '基于真实交易的商家评价体系，好坏一目了然' },
            { icon: '📱', title: '全平台覆盖', desc: 'Web、移动端、PWA，随时随地畅享养宠乐趣' },
          ].map(feature => (
            <div key={feature.title} className="bg-white rounded-xl border border-[#f3f4f6] p-5 hover:shadow-sm transition-shadow">
              <span className="text-2xl">{feature.icon}</span>
              <h3 className="mt-2 font-semibold text-[#1f2937] text-[15px]">{feature.title}</h3>
              <p className="mt-1 text-[13px] text-[#6b7280] leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 核心数据 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#1f2937] mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-[#1a7f5a] rounded-full inline-block"></span>
          核心数据
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: '8+', label: '宠物品类' },
            { value: '1,000+', label: '宠物玩家' },
            { value: '50+', label: '优质商家' },
          ].map(stat => (
            <div key={stat.label} className="bg-gradient-to-br from-[#e8f5ef] to-white rounded-xl border border-[#1a7f5a]/10 p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-[#1a7f5a]">{stat.value}</div>
              <div className="text-[12px] text-[#6b7280] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 联系方式 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#1f2937] mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-[#1a7f5a] rounded-full inline-block"></span>
          联系方式
        </h2>
        <div className="bg-white rounded-xl border border-[#f3f4f6] p-6 space-y-3">
          <div className="flex items-center gap-3 text-[14px] text-[#4b5563]">
            <span className="text-lg">📧</span>
            <span>联系邮箱：<a href="mailto:553043978@qq.com" className="text-[#1a7f5a] hover:underline">553043978@qq.com</a></span>
          </div>
          <div className="flex items-center gap-3 text-[14px] text-[#4b5563]">
            <span className="text-lg">💬</span>
            <span>客服微信：SunrichPet_Official</span>
          </div>
          <div className="flex items-center gap-3 text-[14px] text-[#4b5563]">
            <span className="text-lg">📱</span>
            <span>关注我们：抖音 @SunrichPet · 小红书 @顺瑞益宠</span>
          </div>
        </div>
      </section>

      {/* 加入我们 */}
      <section className="text-center bg-gradient-to-br from-[#e8f5ef] to-white rounded-2xl border border-[#1a7f5a]/10 p-8 md:p-10">
        <h2 className="text-xl font-bold text-[#1f2937] mb-2">加入我们</h2>
        <p className="text-[14px] text-[#6b7280] mb-6">
          无论你是宠物商家还是宠物玩家，都欢迎加入顺瑞益宠大家庭
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/seller/apply"
            className="inline-flex items-center justify-center rounded-full bg-[#1a7f5a] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#166b4b] transition-colors min-h-[44px]"
          >
            商家入驻申请
          </Link>
          <Link
            href="/b"
            className="inline-flex items-center justify-center rounded-full border border-[#1a7f5a] px-6 py-3 text-[14px] font-medium text-[#1a7f5a] hover:bg-[#e8f5ef] transition-colors min-h-[44px]"
          >
            开始探索社区
          </Link>
        </div>
      </section>

      {/* 页脚 */}
      <p className="text-center text-[11px] text-[#d1d5db] mt-10">
        © 2026 顺瑞益宠 SunrichPet.com · 保留所有权利
      </p>
    </div>
  );
}
