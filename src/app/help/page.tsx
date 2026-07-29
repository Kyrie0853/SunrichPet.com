import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: '帮助中心 — 给我爬' };

const faqs = [
  { q: '如何下单？', a: '浏览商品 → 点击「立即购买」或加入购物车 → 填写收货信息（姓名、手机号、地址）→ 提交订单。无需注册登录。' },
  { q: '如何支付？', a: '提交订单后扫描微信收款码，添加客服微信 geiwopa112，转账时在备注中填写订单编号。客服核对后确认收款。' },
  { q: '需要注册账号吗？', a: '不需要。买家可以直接浏览商品并下单，无需注册或登录。' },
  { q: '多久发货？', a: '客服确认收款后，通常在24-48小时内安排发货。具体时效受天气和运输条件影响。' },
  { q: '包损规则是什么？', a: '签收后6小时内凭完整无剪辑开箱视频验货。开箱死亡无条件退款或重发。超时或无开箱视频恕不受理。' },
  { q: '如何联系客服？', a: '添加客服微信：geiwopa112。工作时间：9:00-21:00。非工作时间请留言，客服看到后会尽快回复。' },
  { q: '可以上门自提吗？', a: '目前暂不支持上门自提，所有订单通过快递发货。如有特殊情况请联系客服微信沟通。' },
  { q: '支持哪些支付方式？', a: '目前支持微信扫码支付。转账时请在备注中填写订单编号，方便客服核对。' },
  { q: '"预售中"和"可发货"有什么区别？', a: '可发货：商品已达标，可立即发货。预售中：商品还在成长阶段，需要等待一段时间才能发货，详情页会标注预计发货日期。' },
  { q: '下单后可以取消吗？', a: '未付款的订单可联系客服取消。已付款的订单如需取消，请联系客服协商处理。' },
  { q: '如何查看订单状态？', a: '在订单页面输入订单编号即可查询。订单状态包括：待付款 → 已付款 → 已发货 → 已完成。' },
  { q: '快递用什么物流？', a: '根据地区和活体运输要求，我们会选择顺丰或其他专业活体运输渠道。发货后订单详情页会显示物流单号。' },
  { q: '商品价格可以议价吗？', a: '商品价格已在详情页标明，不接受议价。偶尔有优惠活动会在首页公告中通知，请关注。' },
  { q: '购物车数据会丢失吗？', a: '购物车数据保存在您的浏览器本地存储中。清除浏览器数据或使用不同设备/浏览器，购物车数据不会同步。' },
  { q: '收货地址填写错误怎么办？', a: '请在下单前仔细核对收货信息。如已提交但未发货，立即联系客服微信 geiwopa112 修改地址。' },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-[#1f2937] mb-2">帮助中心</h1>
      <p className="text-[#6b7280] mb-8">常见问题与使用指南</p>

      <section className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-[#f3f4f6]">
        <h2 className="text-xl font-semibold text-[#1f2937] mb-4">🐣 新手指南</h2>
        <div className="space-y-3 text-[15px] text-[#4b5563] leading-relaxed">
          <div className="flex gap-3"><span className="text-xl">1️⃣</span><div><strong>浏览商品</strong><p className="text-[#6b7280] text-[13px]">在商城通过分类卡片和筛选功能查找心仪爬宠</p></div></div>
          <div className="flex gap-3"><span className="text-xl">2️⃣</span><div><strong>提交订单</strong><p className="text-[#6b7280] text-[13px]">填写收货信息，无需注册即可下单</p></div></div>
          <div className="flex gap-3"><span className="text-xl">3️⃣</span><div><strong>扫码支付</strong><p className="text-[#6b7280] text-[13px]">添加客服微信 geiwopa112，转账备注订单编号</p></div></div>
          <div className="flex gap-3"><span className="text-xl">4️⃣</span><div><strong>等待收货</strong><p className="text-[#6b7280] text-[13px]">客服确认收款后安排发货，凭开箱视频验货</p></div></div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#1f2937] mb-4">❓ 常见问题</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="bg-white rounded-xl p-5 shadow-sm border border-[#f3f4f6] group">
              <summary className="cursor-pointer text-[15px] font-medium text-[#1f2937] list-none flex items-center justify-between">
                {faq.q}
                <svg className="h-4 w-4 text-[#9ca3af] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <p className="mt-3 text-[14px] text-[#4b5563] leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl p-6 shadow-sm border border-[#f3f4f6]">
        <h2 className="text-xl font-semibold text-[#1f2937] mb-4">📞 联系我们</h2>
        <div className="text-[15px] text-[#4b5563] space-y-2">
          <p>如以上内容未能解决您的问题，可通过以下方式联系：</p>
          <p>• 客服微信：<strong className="text-[#1a7f5a]">geiwopa112</strong></p>
          <p>• 邮箱：<a href="mailto:553043978@qq.com" className="text-[#1a7f5a] hover:underline">553043978@qq.com</a></p>
          <p>• 工作时间：9:00 - 21:00</p>
          <p>• 查看 <Link href="/rules" className="text-[#1a7f5a] hover:underline">平台规则</Link> 了解更多</p>
        </div>
      </section>
    </div>
  );
}
