import Link from 'next/link';

const sections = [
  {
    title: '平台简介',
    links: [
      { href: '/about', label: '关于我们' },
      { href: '/guide', label: '新手养宠指南' },
      { href: '/encyclopedia', label: '爬宠品种百科' },
      { href: '/shop', label: '宠物商城' },
    ],
  },
  {
    title: '规则与协议',
    links: [
      { href: '/rules', label: '平台规则' },
      { href: '/rules/prohibited', label: '禁卖动物名单' },
      { href: '/rules/after-sale', label: '售后规则' },
      { href: '/report', label: '举报中心' },
    ],
  },
  {
    title: '帮助与支持',
    links: [
      { href: '/help', label: '帮助中心' },
      { href: '/help/newbie', label: '新手指南' },
      { href: '/help/trade', label: '交易指南' },
      { href: '/help/faq', label: '常见问题' },
    ],
  },
  {
    title: '联系方式',
    links: [
      { href: '/seller/apply', label: '商家入驻' },
      { href: '/messages/support', label: '联系客服' },
      { href: '#', label: '工作时间：9:00-21:00' },
      { href: '#', label: '邮箱：553043978@qq.com' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#1a1a2e] text-[#a0aec0] mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        {/* 四列布局 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo + 简介 */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="text-xl font-bold text-white tracking-tight">Sunrich Pet</Link>
            <p className="mt-3 text-[13px] leading-relaxed">顺瑞益宠 — 全国宠物玩家的聚集地。加入社区，分享养宠经验，发现你的宠物伙伴。</p>
          </div>

          {/* 链接列 */}
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

        {/* 版权 */}
        <div className="mt-10 pt-6 border-t border-white/10 text-center text-[11px] text-[#718096]">
          © 2026 顺瑞益宠 SunrichPet.com · 全国宠物玩家的聚集地 · 保留所有权利
        </div>
      </div>
    </footer>
  );
}
