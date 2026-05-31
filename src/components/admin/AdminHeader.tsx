import Link from "next/link";
import Avatar from "@/components/Avatar";

export default function AdminHeader({ displayName, avatarUrl, userId }: { displayName?: string; avatarUrl?: string; userId: string }) {
  return (
    <header className="h-14 bg-white border-b border-[#f3f4f6] flex items-center justify-between px-6">
      <h2 className="text-[15px] font-semibold text-[#1f2937]">管理后台</h2>
      <div className="flex items-center gap-3">
        <Link href="/" className="text-[12px] text-[#6b7280] hover:text-[#1a7f5a] transition-colors">← 返回前台</Link>
        <div className="flex items-center gap-2">
          <Avatar userId={userId} avatarUrl={avatarUrl} displayName={displayName} size={28} />
          <span className="text-[13px] font-medium text-[#1f2937]">{displayName || "管理员"}</span>
        </div>
      </div>
    </header>
  );
}
