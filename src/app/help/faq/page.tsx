import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: '常见问题 | 给我爬' };

const NAV = [
  { href: '/help/newbie', label: '新手指南' }, { href: '/help/trade', label: '交易指南' },
  { href: '/help/after-sale', label: '售后指南' }, { href: '/help/faq', label: '常见问题' },
];

const faqs = [
  { q: '如何下单？', a: '浏览商品 → 点击「立即购买」或加入购物车 → 填写收货信息（姓名、手机号、地址）→ 提交订单。无需注册登录，全程不到1分钟。' },
  { q: '如何支付？', a: '提交订单后扫描微信收款码支付。添加客服微信 geiwopa112，转账时务必在备注中填写订单编号。客服核对后确认收款。' },
  { q: '需要注册账号吗？', a: '买家不需要注册账号。直接浏览商品、下单即可。网站保留的管理员登录仅供内部使用。' },
  { q: '多久发货？', a: '客服确认收款后，通常在24-48小时内安排发货。具体时效受天气、运输条件影响。如需加急请联系客服。' },
  { q: '包损规则是什么？', a: '签收后6小时内凭完整无剪辑开箱视频验货。开箱死亡无条件退款或重发。超时或无完整开箱视频恕不受理。详情见售后规则。' },
  { q: '如何联系客服？', a: '添加客服微信：geiwopa112。工作时间：9:00-21:00，非工作时间请留言。邮箱：553043978@qq.com。' },
  { q: '可以上门自提吗？', a: '目前暂不支持上门自提，所有订单通过快递发货。如有特殊情况请联系客服微信协商。' },
  { q: '支持哪些支付方式？', a: '目前仅支持微信扫码支付。转账时请在备注中填写订单编号，方便客服核对。' },
  { q: '"预售中"和"可发货"有什么区别？', a: '可发货：商品已达标可立即发货。预售中：商品还在成长阶段，需等待达到发货标准，详情页会标注预计发货日期。' },
  { q: '下单后可以取消吗？', a: '未付款订单可联系客服取消。已付款订单如需取消，请尽快联系客服微信 geiwopa112 协商处理。' },
  { q: '如何查看订单状态？', a: '在订单查询页面输入订单编号即可查看。状态流程：待付款 → 已付款 → 已发货 → 已完成。' },
  { q: '快递用什么物流？', a: '根据地区和活体运输要求选择顺丰或其他专业活体运输渠道。发货后订单详情会显示物流单号供追踪。' },
  { q: '商品价格可以议价吗？', a: '商品价格已在详情页标明，不议价。偶尔有优惠活动会在公告中通知，敬请关注。' },
  { q: '购物车数据会丢失吗？', a: '购物车使用浏览器本地存储。清除浏览器数据、隐私模式、或更换设备/浏览器会导致数据不互通。建议尽快下单。' },
  { q: '收货地址写错了怎么办？', a: '请下单前仔细核对。如已提交但未发货，立即联系客服微信 geiwopa112 修改。已发货则无法修改地址。' },
  { q: '如何判断商品是否还在？', a: '商品详情页会显示当前状态。如果显示"已售出"则已被其他买家购买。在售商品会显示"可发货"或"预售中"。' },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex gap-8">
        <aside className="hidden md:block w-48 shrink-0">
          <nav className="sticky top-20 space-y-1">
            {NAV.map(n => <Link key={n.href} href={n.href} className={'block px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ' + (n.href === '/help/faq' ? 'bg-[#e8f5ef] text-[#1a7f5a]' : 'text-[#6b7280] hover:bg-[#f3f4f6]')}>{n.label}</Link>)}
          </nav>
        </aside>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[#1f2937] mb-2">常见问题</h1>
          <p className="text-[#6b7280] mb-8">关于下单、支付、发货、售后的常见问题解答</p>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-white rounded-xl p-5 shadow-sm border border-[#f3f4f6] group">
                <summary className="cursor-pointer text-[15px] font-medium text-[#1f2937] list-none flex items-center justify-between">
                  <span className="text-[#1a7f5a] font-bold mr-2 shrink-0">Q{i + 1}.</span>
                  {faq.q}
                  <svg className="h-4 w-4 text-[#9ca3af] transition-transform group-open:rotate-180 ml-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <p className="mt-3 pl-7 text-[14px] text-[#4b5563] leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}