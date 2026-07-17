import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: '平台规则 — 给我爬' };

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-[#1f2937] mb-2">平台规则</h1>
      <p className="text-[#6b7280] mb-8">最后更新：2026年6月1日</p>

      <section className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-[#f3f4f6]">
        <h2 className="text-xl font-semibold text-[#1f2937] mb-4">用户协议</h2>
        <div className="text-[15px] text-[#4b5563] leading-relaxed space-y-3">
          <p>欢迎使用给我爬平台。在使用本平台服务前，请您仔细阅读以下协议。</p>
          <p><strong>1. 平台定位：</strong>给我爬是一个宠物爱好者交流社区及宠物用品交易平台。所有交易必须在平台内完成，禁止任何形式的私下交易。</p>
          <p><strong>2. 用户责任：</strong>您承诺在平台上发布的信息真实、合法、准确。不得发布违法、侵权、虚假或误导性内容。</p>
          <p><strong>3. 交易规则：</strong>所有买卖交易必须通过平台担保完成。买家付款后款项由平台暂存，买家验货确认后款项转入卖家账户。</p>
          <p><strong>4. 违规处理：</strong>违反平台规则的用户将受到警告、禁言或永久封号处理。平台有权删除违规内容。</p>
          <p><strong>5. 隐私保护：</strong>我们重视您的隐私，详情请参阅隐私政策。</p>
        </div>
      </section>

      <section className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-[#f3f4f6]">
        <h2 className="text-xl font-semibold text-[#1f2937] mb-4">交易规则</h2>
        <div className="text-[15px] text-[#4b5563] leading-relaxed space-y-3">
          <p><strong>担保交易流程：</strong></p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>买家下单并完成支付，款项由平台暂存</li>
            <li>商家在48小时内发货并填写物流单号</li>
            <li>买家收货后有48小时验货期</li>
            <li>验货期内可申请退款/退货</li>
            <li>48小时无异议，系统自动确认收货，款项转入商家账户</li>
          </ol>
        </div>
      </section>

      <section className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-[#f3f4f6]">
        <h2 className="text-xl font-semibold text-[#1f2937] mb-4">禁售清单</h2>
        <div className="text-[15px] text-[#4b5563] leading-relaxed space-y-3">
          <p>以下物品严格禁止在平台交易：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>所有CITES附录I和II物种</li>
            <li>国家一、二级保护动物</li>
            <li>陆龟、蟒蛇、巨蜥、鳄鱼等保护爬行动物</li>
            <li>非法来源的野生动物</li>
            <li>毒品、武器、违禁药品</li>
          </ul>
          <p className="mt-3">详情请查看 <Link href="/rules/prohibited" className="text-[#1a7f5a] hover:underline">禁卖动物名单</Link></p>
        </div>
      </section>

      <section className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-[#f3f4f6]">
        <h2 className="text-xl font-semibold text-[#1f2937] mb-4">违规处罚阶梯</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead><tr className="border-b"><th className="text-left py-2 font-medium">违规次数</th><th className="text-left py-2 font-medium">处罚</th><th className="text-left py-2 font-medium">详情</th></tr></thead>
            <tbody className="text-[#4b5563]">
              <tr className="border-b"><td className="py-2">第1次</td><td className="py-2">⚠️ 警告</td><td className="py-2">记录违规，警告提醒</td></tr>
              <tr className="border-b"><td className="py-2">第2次</td><td className="py-2">🔇 禁言7天</td><td className="py-2">禁止发帖、评论、私信</td></tr>
              <tr><td className="py-2">第3次</td><td className="py-2">🚫 永久封号</td><td className="py-2">无法登录、所有功能停用</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] text-[#9ca3af]">* 违规计数90天清零，严重违规可直接封号</p>
      </section>
    </div>
  );
}
