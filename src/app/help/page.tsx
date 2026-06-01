import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: '帮助中心 — 顺瑞益宠' };

const faqs = [
  { q: '如何注册账号？', a: '点击右上角登录按钮，输入邮箱地址，获取验证码即可注册。也可以使用手机号验证码注册。' },
  { q: '如何发布帖子？', a: '登录后，在首页或社区页面点击发布帖子按钮，填写标题、内容、选择社区即可发布。首次发帖需阅读并同意发帖规则。' },
  { q: '如何购买商品？', a: '在商城浏览商品，加入购物车，进入结算页面完成支付。付款后款项由平台暂存，收到商品确认无误后款项转入商家。' },
  { q: '什么是担保交易？', a: '担保交易是平台为保护买家而设计的交易流程：买家付款→平台暂存→商家发货→买家验货→确认收货→款项转给商家。全程有平台保障。' },
  { q: '如何申请退款？', a: '在我的订单中找到对应订单，点击申请退款，填写退款原因并上传凭证，平台客服会在24小时内处理。' },
  { q: '如何成为商家？', a: '点击底部商家入驻，填写入驻申请表单，上传相关证件，提交后等待平台审核。审核通过后即可上架商品。' },
  { q: '平台禁止交易哪些动物？', a: '请查看禁卖动物名单。所有CITES附录I/II物种、国家保护动物、陆龟、蟒蛇、巨蜥、鳄鱼、鹦鹉等禁止交易。' },
  { q: '忘记密码怎么办？', a: '在登录页面点击忘记密码？，输入注册邮箱，系统会发送重置密码链接到您的邮箱。' },
  { q: '如何举报违规内容？', a: '在帖子或商品详情页，点击举报按钮，选择举报原因并提交。平台管理员会及时处理。' },
  { q: '如何联系平台？', a: '如有其他问题，可通过平台内联系客服功能与管理员取得联系。' },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-[#1f2937] mb-2">帮助中心</h1>
      <p className="text-[#6b7280] mb-8">常见问题与使用指南</p>

      <section className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-[#f3f4f6]">
        <h2 className="text-xl font-semibold text-[#1f2937] mb-4">🐣 新手指南</h2>
        <div className="space-y-3 text-[15px] text-[#4b5563] leading-relaxed">
          <div className="flex gap-3"><span className="text-xl">1️⃣</span><div><strong>注册账号</strong><p className="text-[#6b7280] text-[13px]">使用邮箱或手机号注册，设置头像和昵称</p></div></div>
          <div className="flex gap-3"><span className="text-xl">2️⃣</span><div><strong>浏览社区</strong><p className="text-[#6b7280] text-[13px]">选择感兴趣的宠物社区，浏览帖子、参与讨论</p></div></div>
          <div className="flex gap-3"><span className="text-xl">3️⃣</span><div><strong>发布内容</strong><p className="text-[#6b7280] text-[13px]">分享你的养宠经验，上传照片，与其他宠友互动</p></div></div>
          <div className="flex gap-3"><span className="text-xl">4️⃣</span><div><strong>购买宠物</strong><p className="text-[#6b7280] text-[13px]">在商城选购心仪的宠物，通过平台担保交易安全购买</p></div></div>
          <div className="flex gap-3"><span className="text-xl">5️⃣</span><div><strong>成为商家</strong><p className="text-[#6b7280] text-[13px]">申请入驻，上架商品，在平台开店经营</p></div></div>
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
        <h2 className="text-xl font-semibold text-[#1f2937] mb-4">📞 联系平台</h2>
        <div className="text-[15px] text-[#4b5563] space-y-2">
          <p>如以上内容未能解决您的问题，可通过以下方式联系：</p>
          <p>• 平台内私信管理员</p>
          <p>• 查看 <Link href="/rules" className="text-[#1a7f5a] hover:underline">平台规则</Link> 了解更多</p>
        </div>
      </section>
    </div>
  );
}
