import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '新手指南 | 给我爬',
  description: '给我爬商城使用指南：如何浏览、下单、支付、收货。个人爬宠工作室直营商城。',
  keywords: '新手养宠,新手教程,购买流程,收货验货,爬宠商城',
};

const guides = [
  { slug: 'how-to-buy', icon: '🛒', title: '如何浏览与购买', desc: '从浏览商品到提交订单的完整流程：分类筛选、商品详情、填写收货信息、提交订单。', color: 'from-amber-400 to-orange-400' },
  { slug: 'how-to-pay', icon: '💚', title: '如何支付', desc: '微信扫码支付流程：添加客服微信 geiwopa112，转账备注订单编号，等待客服确认收款。', color: 'from-green-400 to-emerald-400' },
  { slug: 'receiving-guide', icon: '📦', title: '收货验货指南', desc: '开箱视频录制要点、包损条款、验货时效。保护您的权益，确保安全收货。', color: 'from-blue-400 to-indigo-400' },
  { slug: 'care-basics', icon: '🦎', title: '爬宠饲养基础', desc: '守宫、蛇类等常见爬宠的饲养环境搭建、温湿度控制、喂食频率等基础知识。', color: 'from-purple-400 to-pink-400' },
];

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-3">新手指南</h1>
        <p className="text-[#6b7280] text-[15px] md:text-lg">快速了解如何在给我爬商城选购心仪的爬宠</p>
      </div>

      {/* 快速入门 4 步 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
        {[
          { step: '1', title: '浏览商品', desc: '通过分类卡片或筛选功能查找心仪爬宠', icon: '🔍' },
          { step: '2', title: '提交订单', desc: '填写收货信息，无需注册即可下单', icon: '📝' },
          { step: '3', title: '扫码支付', desc: '添加客服微信 geiwopa112 完成支付', icon: '💚' },
          { step: '4', title: '等待收货', desc: '客服确认收款后安排发货，坐等宝贝到家', icon: '📦' },
        ].map(s => (
          <div key={s.step} className="bg-white rounded-xl border border-[#f3f4f6] p-5 text-center hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-[#e8f5ef] text-[#1a7f5a] flex items-center justify-center mx-auto mb-3 text-[18px] font-bold">{s.step}</div>
            <p className="text-2xl mb-2">{s.icon}</p>
            <h3 className="font-semibold text-[#1f2937] text-[14px]">{s.title}</h3>
            <p className="text-[12px] text-[#6b7280] mt-1">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* 详细指南卡片 */}
      <h2 className="text-lg md:text-xl font-bold text-[#1f2937] mb-5 flex items-center gap-2">
        <span className="w-1 h-5 bg-[#1a7f5a] rounded-full inline-block"></span>
        详细指南
      </h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {guides.map(g => (
          <Link key={g.slug} href={'/guide/' + g.slug}
            className="group rounded-2xl overflow-hidden shadow-sm border border-[#f3f4f6] hover:shadow-md transition-all duration-300">
            <div className={'h-2 bg-gradient-to-r ' + g.color}></div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{g.icon}</span>
                <h2 className="text-xl font-bold text-[#1f2937] group-hover:text-[#1a7f5a] transition-colors">{g.title}</h2>
              </div>
              <p className="text-[14px] text-[#6b7280] leading-relaxed">{g.desc}</p>
              <span className="inline-block mt-4 text-[13px] font-medium text-[#1a7f5a] group-hover:translate-x-1 transition-transform">开始阅读 →</span>
            </div>
          </Link>
        ))}
      </div>

      {/* 客服联系 */}
      <div className="mt-12 bg-[#e8f5ef] rounded-2xl p-8 text-center">
        <h3 className="text-lg font-bold text-[#1a7f5a] mb-2">💚 还有疑问？</h3>
        <p className="text-[13px] text-[#1a7f5a]/80 mb-4">添加客服微信 <strong className="text-[#1a7f5a]">geiwopa112</strong>，在线为您解答</p>
        <Link href="/shop" className="inline-block rounded-full bg-[#1a7f5a] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#166b4b]">去逛逛商城</Link>
      </div>
    </div>
  );
}