import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '关于我 — 给我爬',
  description: '了解给我爬爬宠工作室的品牌故事、繁育理念和担保交易承诺。',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 py-10 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-3">
          关于 给我爬
        </h1>
        <p className="text-[#6b7280] text-[15px] md:text-lg">
          个人繁育者 · 专注高品质守宫繁育
        </p>
      </div>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#1f2937] mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-[#1a7f5a] rounded-full inline-block"></span>
          品牌故事
        </h2>
        <p className="text-[15px] text-[#4b5563] leading-relaxed">
          给我爬是一个个人繁育者经营的专业爬宠工作室，专注于豹纹守宫、睫角守宫等高品质爬宠的繁育与销售。
          每一只个体都经过精心养护，从孵化到出壳、从幼苗到成体，每一个环节都倾注了繁育者的心血。
        </p>
        <p className="mt-4 text-[15px] text-[#4b5563] leading-relaxed">
          我们坚持&quot;养成系&quot;理念，不追求数量而注重品质。每一只在售个体都有详细的生长记录，
          包括出生日期、基因品系、体重变化、性格特征等，让你买得放心、养得安心。
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#1f2937] mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-[#1a7f5a] rounded-full inline-block"></span>
          繁育理念
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: '🦎', title: '品质优先', desc: '严格筛选种源，确保基因健康。每只个体单独记录，建立完整的繁育谱系' },
            { icon: '🏠', title: '家庭式养护', desc: '小规模精细化管理，每一只都有充足的生长空间和个性化照料' },
            { icon: '🛡️', title: '担保交易', desc: '全站交易通过支付宝担保完成，杜绝私下转账，保障买卖双方权益' },
            { icon: '📦', title: '安全包装', desc: '专业爬宠运输包装，恒温恒湿，确保活体安全抵达' },
          ].map(feature => (
            <div key={feature.title} className="bg-white rounded-xl border border-[#f3f4f6] p-5 hover:shadow-sm transition-shadow">
              <span className="text-2xl">{feature.icon}</span>
              <h3 className="mt-2 font-semibold text-[#1f2937] text-[15px]">{feature.title}</h3>
              <p className="mt-1 text-[13px] text-[#6b7280] leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#1f2937] mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-[#1a7f5a] rounded-full inline-block"></span>
          担保交易说明
        </h2>
        <div className="bg-[#e8f5ef] rounded-xl border border-[#1a7f5a]/20 p-6 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">1️⃣</span>
            <div>
              <p className="font-semibold text-[#1f2937] text-[14px]">下单付款</p>
              <p className="text-[13px] text-[#4b5563]">通过支付宝担保交易接口付款，款项由支付宝托管</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">2️⃣</span>
            <div>
              <p className="font-semibold text-[#1f2937] text-[14px]">商家发货</p>
              <p className="text-[13px] text-[#4b5563]">收到订单后精心打包发货，录入物流单号供实时追踪</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">3️⃣</span>
            <div>
              <p className="font-semibold text-[#1f2937] text-[14px]">验货签收</p>
              <p className="text-[13px] text-[#4b5563]">收到后6小时内凭完整开箱视频验货，确认无误后点击确认收货</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">4️⃣</span>
            <div>
              <p className="font-semibold text-[#1f2937] text-[14px]">结算完成</p>
              <p className="text-[13px] text-[#4b5563]">买家确认收货后，款项自动结算。若有问题，依据开箱视频友好协商</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#1f2937] mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-[#1a7f5a] rounded-full inline-block"></span>
          联系方式
        </h2>
        <div className="bg-white rounded-xl border border-[#f3f4f6] p-6 space-y-3">
          <div className="flex items-center gap-3 text-[14px] text-[#4b5563]">
            <span className="text-lg">📧</span>
            <span>邮箱：<a href="mailto:553043978@qq.com" className="text-[#1a7f5a] hover:underline">553043978@qq.com</a></span>
          </div>
          <div className="flex items-center gap-3 text-[14px] text-[#4b5563]">
            <span className="text-lg">🕐</span>
            <span>工作时间：9:00 - 21:00</span>
          </div>
          <div className="flex items-center gap-3 text-[14px] text-[#4b5563]">
            <span className="text-lg">🛡️</span>
            <span>所有交易请通过本站支付宝担保完成，杜绝私下转账</span>
          </div>
        </div>
      </section>

      <section className="text-center bg-gradient-to-br from-[#e8f5ef] to-white rounded-2xl border border-[#1a7f5a]/10 p-8 md:p-10">
        <h2 className="text-xl font-bold text-[#1f2937] mb-2">感谢信任</h2>
        <p className="text-[14px] text-[#6b7280] mb-6">
          每一份信任都来之不易，我会用心对待每一只个体、每一个订单
        </p>
        <Link href="/shop"
          className="inline-flex items-center justify-center rounded-full bg-[#1a7f5a] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#166b4b] transition-colors min-h-[44px]">
          查看在售个体
        </Link>
      </section>
    </div>
  );
}
