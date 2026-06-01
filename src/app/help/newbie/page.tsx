import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: '新手指南 | 顺瑞益宠', description: '顺瑞益宠新手指南：注册、发帖、关注、社区规则入门。' };

const NAV = [
  { href: '/help/newbie', label: '新手指南' }, { href: '/help/trade', label: '交易指南' },
  { href: '/help/after-sale', label: '售后指南' }, { href: '/help/seller', label: '商家指南' }, { href: '/help/faq', label: '常见问题' },
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
          <p className="text-[#6b7280] mb-8">快速上手顺瑞益宠，成为社区活跃成员</p>
          <div className="prose max-w-none space-y-8 text-[15px] leading-relaxed text-[#4b5563]">
            <section><h3 className="text-lg font-bold text-[#1f2937]">1. 如何注册账号</h3><p>点击页面右上角的「登录」按钮，输入您的邮箱地址，系统会发送验证码到您的邮箱。输入验证码即可完成注册。您也可以使用密码登录方式注册。</p></section>
            <section><h3 className="text-lg font-bold text-[#1f2937]">2. 如何完善个人资料</h3><p>登录后，点击右上角头像 →「个人中心」→「编辑资料」。您可以设置头像、昵称和个人签名。头像建议使用清晰的正面照片或宠物照片。</p></section>
            <section><h3 className="text-lg font-bold text-[#1f2937]">3. 如何发帖和评论</h3><p>在首页或社区页面，点击「发布帖子」按钮。填写标题、选择分类、撰写内容后即可发布。在帖子详情页底部可直接发表评论。首次发帖前需要阅读并同意社区规则。</p></section>
            <section><h3 className="text-lg font-bold text-[#1f2937]">4. 如何关注其他用户</h3><p>在帖子详情页或用户主页，点击「+ 关注」按钮即可关注感兴趣的用户。关注后，您可以在「动态流」中看到他们的最新帖子。</p></section>
            <section><h3 className="text-lg font-bold text-[#1f2937]">5. 社区规则简介</h3><p>请遵守以下社区规则：禁止发布保护动物交易信息、禁止留联系方式引导私下交易、禁止发布违法或不当内容。详细规则请查看 <Link href="/rules" className="text-[#1a7f5a]">平台规则</Link>。</p></section>
          </div>
        </div>
      </div>
    </div>
  );
}