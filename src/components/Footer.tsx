import Link from 'next/link';

const sections = [
  {
    title: '工作室',
    links: [
      { href: '/about', label: '关于我们' },
      { href: '/blog', label: '繁育笔记' },
      { href: '/shop', label: '在售个体' },
      { href: '/b', label: '社区' },
    ],
  },
  {
    title: '交易保障',
    links: [
      { href: '/help/trade', label: '担保交易说明' },
      { href: '/rules/after-sale', label: '包损条款' },
      { href: '/help/faq', label: '常见问题' },
    ],
  },
  {
    title: '帮助与支持',
    links: [
      { href: '/help', label: '帮助中心' },
      { href: '/guide', label: '新手养宠指南' },
      { href: '/encyclopedia', label: '宠物品种百科' },
      { href: '/report', label: '举报中心' },
    ],
  },
  {
    title: '联系方式',
    links: [
      { href: '/messages/support', label: '联系客服' },
      { href: '#', label: '工作时间：9:00-21:00' },
      { href: '#', label: '邮箱：553043978@qq.com' },
      { href: '#', label: '支付宝担保交易' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#1a1a2e] text-[#a0aec0] mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="text-xl font-bold text-white tracking-tight">Sunrich Pet</Link>
            <p className="mt-3 text-[13px] leading-relaxed">个人爬宠工作室直营商城。专注高品质守宫繁育，每一只都是亲手养大的宝贝。</p>
            <div className="mt-3 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-[11px] text-emerald-300">
              🛡️ 全站支付宝担保交易 · 杜绝私下转账
            </div>
          </div>
          {sections.map(sec => (
            <div key={sec.title}>
              <h4 className="text-[13px] font-semibold text-white mb-3">{sec.title}</h4>
              <ul className="space-y-2">
                {sec.links.map(link => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[13px] hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 text-center text-[11px] text-[#718096]">
          © 2026 Sunrich Pet 爬宠工作室 · 个人繁育者实名经营 · 支付宝担保交易保障 · 保留所有权利
        </div>
      </div>
    </footer>
  );
}
