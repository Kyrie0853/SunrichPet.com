import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="hidden md:block bg-white border-t border-[#f3f4f6] py-6 mt-auto">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px]">
          <Link href="/rules" className="text-[#6b7280] hover:text-[#1a7f5a] transition-colors">
            平台规则
          </Link>
          <span className="text-[#e5e7eb]">|</span>
          <Link href="/rules/prohibited" className="text-[#6b7280] hover:text-[#1a7f5a] transition-colors">
            禁卖名单
          </Link>
          <span className="text-[#e5e7eb]">|</span>
          <Link href="/rules/after-sale" className="text-[#6b7280] hover:text-[#1a7f5a] transition-colors">
            售后规则
          </Link>
          <span className="text-[#e5e7eb]">|</span>
          <Link href="/report" className="text-[#6b7280] hover:text-[#1a7f5a] transition-colors">
            举报中心
          </Link>
          <span className="text-[#e5e7eb]">|</span>
          <Link href="/seller/apply" className="text-[#6b7280] hover:text-[#1a7f5a] transition-colors">
            商家入驻
          </Link>
          <span className="text-[#e5e7eb]">|</span>
          <Link href="/help" className="text-[#6b7280] hover:text-[#1a7f5a] transition-colors">
            帮助中心
          </Link>
        </div>
        <p className="text-center text-[11px] text-[#d1d5db] mt-3">
          © 2026 Sunrich Pet 顺瑞益宠 — 平台担保交易保障 · 保护动物禁止交易
        </p>
      </div>
    </footer>
  );
}
