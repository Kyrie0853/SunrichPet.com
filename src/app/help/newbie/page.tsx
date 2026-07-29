import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: '新手指南 | 给我爬', description: '给我爬新手指南：如何浏览、下单、支付、收货。' };

const NAV = [
  { href: '/help/newbie', label: '新手指南' }, { href: '/help/trade', label: '交易指南' },
  { href: '/help/after-sale', label: '售后指南' }, { href: '/help/faq', label: '常见问题' },
];

export default function NewbiePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex gap-8">
        <aside className="hidden md:block w-48 shrink-0">
          <nav className="sticky top-20 space-y-1">
            {NAV.map(n => <Link key={n.href} href={n.href} className={'block px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ' + (n.href === '/help/newbie' ? 'bg-[#e8f5ef] text-[#1a7f5a]' : 'text-[#6b7280] hover:bg-[#f3f4f6]')}>{n.label}</Link>)}
          </nav>
        </aside>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[#1f2937] mb-2">新手指南</h1>
          <p className="text-[#6b7280] mb-8">快速上手给我爬商城，选购心仪的爬宠</p>
          <div className="prose max-w-none space-y-8 text-[15px] leading-relaxed text-[#4b5563]">
            <section><h3 className="text-lg font-bold text-[#1f2937]">1. 浏览商品</h3><p>打开给我爬网站，在首页可以看到所有爬宠分类卡片。点击分类进入商品列表，可通过状态、价格、品系等条件筛选。也可以直接在搜索框输入品种名称查找。</p></section>
            <section><h3 className="text-lg font-bold text-[#1f2937]">2. 查看详情</h3><p>点击商品卡片进入详情页，可以查看高清图片、基因品系、出生日期、体重、性格特点等完整信息。每个商品下方都有包损条款说明。</p></section>
            <section><h3 className="text-lg font-bold text-[#1f2937]">3. 提交订单</h3><p>点击「立即购买」或「加入购物车」后统一结算。填写收货人姓名、手机号、详细地址即可提交订单，<strong>无需注册登录</strong>。支持智能粘贴：直接复制姓名+电话+地址粘贴到识别框。</p></section>
            <section><h3 className="text-lg font-bold text-[#1f2937]">4. 完成支付</h3><p>提交订单后扫描微信收款码支付。添加客服微信 <strong>geiwopa112</strong>，转账时在备注中填写订单编号。客服核对后确认收款并安排发货。</p></section>
            <section><h3 className="text-lg font-bold text-[#1f2937]">5. 收货验货</h3><p>收到包裹后，请在6小时内凭完整无剪辑开箱视频验货。开箱死亡无条件退款或重发。详细规则请查看 <Link href="/rules/after-sale" className="text-[#1a7f5a]">售后规则</Link>。</p></section>
          </div>
        </div>
      </div>
    </div>
  );
}