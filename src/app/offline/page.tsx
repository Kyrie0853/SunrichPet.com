import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: '离线 — 给我爬' };

export default function OfflinePage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#1a7f5a] flex items-center justify-center text-white text-3xl font-bold">SR</div>
        <h1 className="text-xl font-bold text-[#1f2937] mb-2">当前无网络连接</h1>
        <p className="text-[14px] text-[#6b7280] mb-6">请检查网络后重试，或访问已缓存的页面</p>
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <Link href="/" className="rounded-full bg-[#1a7f5a] px-5 py-2 text-[13px] font-medium text-white">首页</Link>
          <Link href="/b" className="rounded-full border border-[#d1d5db] px-5 py-2 text-[13px] font-medium text-[#6b7280]">社区</Link>
          <Link href="/shop" className="rounded-full border border-[#d1d5db] px-5 py-2 text-[13px] font-medium text-[#6b7280]">商城</Link>
        </div>
        <Link href="/" className="text-[13px] text-[#1a7f5a] hover:underline">🔄 点击重试</Link>
      </div>
    </div>
  );
}