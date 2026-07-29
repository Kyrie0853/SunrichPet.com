import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: '交易指南 | 给我爬', description: '给我爬交易指南：浏览商品、下单购买、微信扫码支付、收货验货。' };

const NAV = [
  { href: '/help/newbie', label: '新手指南' }, { href: '/help/trade', label: '交易指南' },
  { href: '/help/after-sale', label: '售后指南' }, { href: '/help/faq', label: '常见问题' },
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
            <section><h3 className="text-lg font-bold text-[#1f2937]">1. 如何浏览商品</h3><p>进入「商城」页面，通过分类卡片浏览或在搜索框输入关键词查找。点击商品卡片进入详情页查看基因品系、出生日期、体重等完整信息。</p></section>
            <section><h3 className="text-lg font-bold text-[#1f2937]">2. 如何下单</h3><p>在商品详情页点击「立即购买」直接下单，或「加入购物车」后统一结算。填写收货人姓名、手机号、详细地址，无需注册即可提交订单。</p></section>
            <section><h3 className="text-lg font-bold text-[#1f2937]">3. 如何支付</h3><p>💚 提交订单后扫描微信收款码支付。添加客服微信 <strong>geiwopa112</strong>，转账时在备注中填写订单编号。客服核对后确认收款，订单状态更新为"已付款"。</p></section>
            <section><h3 className="text-lg font-bold text-[#1f2937]">4. 收货验货</h3><p>签收后6小时内凭完整无剪辑开箱视频验货。开箱死亡无条件退款或重发。详细规则请查看包损条款。</p></section>
            <section><h3 className="text-lg font-bold text-[#1f2937]">5. 发货时效</h3><p>客服确认收款后，通常在24-48小时内安排发货。根据天气和运输条件，发货时间可能略有调整，请以订单状态为准。</p></section>
          </div>
        </div>
      </div>
    </div>
  );
}