import { getUserProfile } from "@/lib/supabase/community";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import UserProfileTabs from "@/components/community/UserProfileTabs";

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = await getUserProfile(id);

  // 用户不存在时显示友好提示，而非硬 404（头像跳转等场景更友好）
  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="text-5xl mb-4">👤</p>
        <h1 className="text-xl font-bold text-gray-700 mb-2">用户不存在</h1>
        <p className="text-sm text-gray-400 mb-6">该用户可能已注销或账号数据异常</p>
        <Link href="/" className="inline-block rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
          返回首页
        </Link>
      </div>
    );
  }

  return (<div className="mx-auto max-w-4xl px-4 py-10"><Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-700">&larr; 返回首页</Link><UserProfileTabs profile={profile} currentUserId={user?.id || null} /></div>);
}