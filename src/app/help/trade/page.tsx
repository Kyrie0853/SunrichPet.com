import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: '交易指南 | 顺瑞益宠', description: '顺瑞益宠交易指南：浏览商品、下单购买、担保交易流程、收货验货、确认收货。' };

const NAV = [
  { href: '/help/newbie', label: '新手指南' }, { href: '/help/trade', label: '交易指南' },
  { href: '/help/after-sale', label: '售后指南' }, { href: '/help/seller', label: '商家指南' }, { href: '/help/faq', label: '常见问题' },
];

export default function TradeHelpPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex gap-8">
        <aside className="hidden md:block w-48 shrink-0">
          <nav className="sticky top-20 space-y-1">
            {NAV.map(n => <Link key={n.href} href={n.href} className={'block px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ' + (n.href === '/help/trade' ? 'bg-[#e8f5ef] text-[#1a7f5a]' : 'text-[#6b7280] hover:bg-[#f3f4f6]')}>{n.label}</Link>)}
          </nav>
        </aside>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[#1f2937] mb-2">交易指南</h1>
          <p className="text-[#6b7280] mb-8">了解如何在平台安全购买宠物和用品</p>
          <div className="prose max-w-none space-y-8 text-[15px] leading-relaxed text-[#4b5563]">
            <section><h3 className="text-lg font-bold text-[#1f2937]">1. 如何浏览商品</h3><p>进入「商城」页面，可以通过分类浏览或在搜索框中输入关键词查找商品。点击商品卡片进入详情页查看更多信息。</p></section>
            <section><h3 className="text-lg font-bold text-[#1f2937]">2. 如何下单购买</h3><p>在商品详情页点击「加入购物车」，然后进入购物车确认商品和数量。点击「结算」进入确认订单页面，填写收货信息后提交订单。</p></section>
            <section><h3 className="text-lg font-bold text-[#1f2937]">3. 担保交易流程</h3><p>🛡️ 平台采用担保交易模式：① 提交订单 → ② 联系管理员确认收款 → ③ 商家发货 → ④ 收货验货（48小时）→ ⑤ 确认收货。您的款项在确认收货前由平台保障。</p></section>
            <section><h3 className="text-lg font-bold text-[#1f2937]">4. 收货验货注意事项</h3><p>收到商品后请当场开箱验货，活体宠物建议录制开箱视频。如发现商品有问题，请在48小时内联系商家或申请退款。</p></section>
            <section><h3 className="text-lg font-bold text-[#1f2937]">5. 如何确认收货</h3><p>在「我的订单」中点击订单进入详情页，验货无误后点击「确认收货」按钮。确认收货后款项将转入商家账户。</p></section>
          </div>
        </div>
      </div>
    </div>
  );
}