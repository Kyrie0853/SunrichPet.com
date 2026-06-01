import type { Metadata } from 'next';

export const metadata: Metadata = { title: '禁卖动物名单 — 顺瑞益宠' };

const animals = [
  { category: '龟类', items: ['陆龟（所有种类）', '缅甸陆龟', '辐射陆龟', '安哥洛卡象龟', '苏卡达陆龟', '豹纹陆龟', '赫曼陆龟', '印度星龟', '缅甸星龟', '凹甲陆龟', '四爪陆龟', '黄缘闭壳龟', '黄喉拟水龟（野生种群）', '玳瑁'] },
  { category: '蛇类', items: ['蟒蛇（所有种类）', '球蟒', '缅甸蟒', '网纹蟒', '黄金蟒', '绿水蚺', '森蚺（所有种类）'] },
  { category: '蜥蜴类', items: ['巨蜥（所有种类）', '科莫多巨蜥', '圆鼻巨蜥', '瑶山鳄蜥', '鳄鱼（所有种类）'] },
  { category: '鸟类', items: ['鹦鹉（所有种类，除虎皮鹦鹉、鸡尾鹦鹉、桃脸牡丹鹦鹉）', '灰鹦鹉', '金刚鹦鹉', '葵花鹦鹉'] },
  { category: '其他', items: ['大鲵（娃娃鱼）', '蝾螈（所有种类）', '穿山甲', '猕猴', '懒猴', '所有CITES附录I物种', '所有国家一级保护动物', '所有国家二级保护动物（未经许可）'] },
];

export default function ProhibitedPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-[#1f2937] mb-2">🚫 禁卖动物名单</h1>
      <p className="text-[#6b7280] mb-2">以下动物严格禁止在本平台展示、交易、赠予。</p>
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 text-[14px] text-red-700">
        ⚠️ 违反本规则的卖家将被立即永久封号，并依法向有关部门举报。
      </div>

      {animals.map(section => (
        <section key={section.category} className="mb-6 bg-white rounded-xl p-6 shadow-sm border border-[#f3f4f6]">
          <h2 className="text-lg font-semibold text-[#1f2937] mb-3">{section.category}</h2>
          <ul className="space-y-1.5">
            {section.items.map(item => (
              <li key={item} className="flex items-start gap-2 text-[15px] text-[#4b5563]">
                <span className="text-red-400 mt-0.5">✕</span> {item}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="bg-[#f9fafb] rounded-xl p-6 text-[14px] text-[#6b7280]">
        <p className="font-medium mb-2">📖 法律依据：</p>
        <ul className="space-y-1">
          <li>《中华人民共和国野生动物保护法》</li>
          <li>《濒危野生动植物种国际贸易公约》（CITES）</li>
          <li>《国家重点保护野生动物名录》</li>
        </ul>
        <p className="mt-3">如需确认某种动物是否可交易，请联系平台客服核实。</p>
      </div>
    </div>
  );
}
