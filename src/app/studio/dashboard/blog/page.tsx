import Link from "next/link";

export default function StudioBlogPage() {
  return (
    <div>
      <h1 className="text-lg md:text-xl font-semibold text-[#1f2937] mb-6">笔记管理</h1>
      <div className="max-w-md bg-white rounded-xl border border-[#f3f4f6] p-8 text-center">
        <p className="text-5xl mb-4">📝</p>
        <h3 className="text-[15px] font-semibold text-[#1f2937] mb-2">繁育笔记功能即将上线</h3>
        <p className="text-[13px] text-[#6b7280] mb-6">第二期将开放博客管理功能</p>
        <Link href="/studio/dashboard" className="inline-block rounded-full bg-[#1a7f5a] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#166b4b]">返回仪表盘</Link>
      </div>
    </div>
  );
}
