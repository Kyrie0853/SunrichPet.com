import { getUserProfile } from "@/lib/supabase/community";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import UserProfileTabs from "@/components/community/UserProfileTabs";

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = await getUserProfile(id);

  // 用户不存在时 — 区分是自己还是他人
  if (!profile) {
    const isSelf = user?.id === id;
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="text-5xl mb-4">👤</p>
        <h1 className="text-xl font-bold text-gray-700 mb-2">
          {isSelf ? "个人资料未创建" : "用户不存在"}
        </h1>
        <p className="text-sm text-gray-400 mb-2">
          {isSelf
            ? "您的账号资料尚未同步。请管理员在 Supabase SQL Editor 中执行 docs/fix-missing-profiles.sql"
            : "该用户可能已注销或账号数据异常"}
        </p>
        {isSelf && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg inline-block px-3 py-1.5 mb-6">
            ⚠️ 其他功能（发帖、评论等）可能同样受影响，请尽快修复
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <Link href="/" className="inline-block rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
            返回首页
          </Link>
          {!isSelf && (
            <Link href="/community" className="inline-block rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
              浏览社区
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (<div className="mx-auto max-w-4xl px-4 py-10"><Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-700">&larr; 返回首页</Link><UserProfileTabs profile={profile} currentUserId={user?.id || null} /></div>);
}