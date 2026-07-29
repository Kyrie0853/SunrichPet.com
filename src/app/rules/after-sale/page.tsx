import type { Metadata } from 'next';

export const metadata: Metadata = { title: '售后规则 — 给我爬' };

export default function AfterSalePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-[#1f2937] mb-2">售后规则</h1>
      <p className="text-[#6b7280] mb-8">保障买卖双方权益的完整售后流程</p>

      <section className="mb-6 bg-white rounded-xl p-6 shadow-sm border border-[#f3f4f6]">
        <h2 className="text-xl font-semibold text-[#1f2937] mb-4">💚 交易流程</h2>
        <div className="space-y-3 text-[15px] text-[#4b5563] leading-relaxed">
          <div className="flex gap-3"><span className="text-[#1a7f5a] font-bold shrink-0">1.</span><div><strong>下单</strong><p className="text-[#6b7280] text-[13px]">买家下单并填写收货信息，获得订单编号</p></div></div>
          <div className="flex gap-3"><span className="text-[#1a7f5a] font-bold shrink-0">2.</span><div><strong>扫码支付</strong><p className="text-[#6b7280] text-[13px]">添加客服微信 geiwopa112，转账备注订单编号</p></div></div>
          <div className="flex gap-3"><span className="text-[#1a7f5a] font-bold shrink-0">3.</span><div><strong>确认发货</strong><p className="text-[#6b7280] text-[13px]">客服核对收款后24-48小时内发货，填写物流单号</p></div></div>
          <div className="flex gap-3"><span className="text-[#1a7f5a] font-bold shrink-0">4.</span><div><strong>验货签收</strong><p className="text-[#6b7280] text-[13px]">签收后6小时内凭完整开箱视频验货，确认无误</p></div></div>
        </div>
      </section>

      <section className="mb-6 bg-white rounded-xl p-6 shadow-sm border border-[#f3f4f6]">
        <h2 className="text-xl font-semibold text-[#1f2937] mb-4">📋 退款条件</h2>
        <ul className="space-y-2 text-[15px] text-[#4b5563]">
          <li className="flex gap-2"><span className="text-[#1a7f5a]">✓</span> 商品与描述严重不符</li>
          <li className="flex gap-2"><span className="text-[#1a7f5a]">✓</span> 收到商品已死亡/损坏（需提供开箱视频）</li>
          <li className="flex gap-2"><span className="text-[#1a7f5a]">✓</span> 商家未在承诺时间内发货</li>
          <li className="flex gap-2"><span className="text-[#1a7f5a]">✓</span> 收到商品品种/规格与订单不符</li>
          <li className="flex gap-2"><span className="text-red-400">✕</span> 买家个人原因（不喜欢/不想要） — 需与商家协商</li>
        </ul>
      </section>

      <section className="mb-6 bg-white rounded-xl p-6 shadow-sm border border-[#f3f4f6]">
        <h2 className="text-xl font-semibold text-[#1f2937] mb-4">🔧 平台介入机制</h2>
        <div className="text-[15px] text-[#4b5563] leading-relaxed space-y-2">
          <p>当买卖双方无法协商一致时，可申请平台介入：</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>买家在订单详情页点击"申请退款"</li>
            <li>填写退款原因，上传凭证（照片/视频）</li>
            <li>平台客服在24小时内介入处理</li>
            <li>平台根据双方证据做出裁决</li>
          </ol>
        </div>
      </section>

      <section className="bg-white rounded-xl p-6 shadow-sm border border-[#f3f4f6]">
        <h2 className="text-xl font-semibold text-[#1f2937] mb-4">📦 活体宠物特殊规则</h2>
        <div className="text-[15px] text-[#4b5563] leading-relaxed space-y-2">
          <p><strong>开箱视频：</strong>活体宠物到货后，请在快递员面前开箱并全程录像。无开箱视频的死亡/损坏索赔将不被受理。</p>
          <p><strong>包活时效：</strong>商家承诺的包活时间（通常24-48小时），超过时效的死亡不包赔。</p>
          <p><strong>瑕疵说明：</strong>商家在商品描述中已明确说明的瑕疵（如尾部轻微弯曲等），不属于退款理由。</p>
          <p><strong>发货范围：</strong>部分活体宠物受气温、运输条件限制，商家有权限制发货省份，请下单前确认。</p>
        </div>
      </section>
    </div>
  );
}
