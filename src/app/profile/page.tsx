import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import { LogoutButton } from "@/components/LogoutButton";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  let profile: any = null;
  let profileError: { code: string; message: string; hint: string } | null = null;

  try {
    // 使用 maybeSingle() 而非 single() — 0行返回null不抛异常
    const { data: p, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      // 真正的数据库错误（非0行）
      profileError = {
        code: error.code || "UNKNOWN",
        message: error.message || String(error),
        hint: (error as any).hint || "",
      };
    } else {
      profile = p; // p 可能是 null
    }
  } catch (err: any) {
    profileError = {
      code: "EXCEPTION",
      message: err?.message || String(err),
      hint: err?.cause || "",
    };
  }

  const displayName = profile?.display_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "用户";

  if (profileError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 md:p-8">
          <p className="text-5xl mb-4 text-center">😥</p>
          <h2 className="text-[16px] font-bold text-red-700 mb-4 text-center">profiles 表查询失败</h2>

          {/* 错误详情 */}
          <div className="mb-4 rounded-xl bg-white border border-red-100 p-4 text-[13px] font-mono">
            <div className="mb-1">
              <span className="text-red-500 font-bold">错误码：</span>
              <span className="text-gray-700">{profileError.code}</span>
            </div>
            <div className="mb-1">
              <span className="text-red-500 font-bold">消息：</span>
              <span className="text-gray-700">{profileError.message}</span>
            </div>
            {profileError.hint && (
              <div className="mb-1">
                <span className="text-red-500 font-bold">提示：</span>
                <span className="text-gray-600">{profileError.hint}</span>
              </div>
            )}
            <div className="mt-2 pt-2 border-t border-red-50">
              <span className="text-red-500 font-bold">用户 ID：</span>
              <span className="text-gray-500 break-all">{user.id}</span>
            </div>
            <div>
              <span className="text-red-500 font-bold">邮箱：</span>
              <span className="text-gray-500">{user.email}</span>
            </div>
          </div>

          {/* 修复指引 */}
          <div className="mb-4 rounded-xl bg-white border border-red-100 p-4 text-[13px]">
            <p className="font-bold text-red-600 mb-2">修复指引：</p>
            {profileError.code === "42P01" && (
              <p className="text-gray-600"><b>表不存在。</b>请在 Supabase SQL Editor 执行 <code className="mx-1 rounded bg-gray-100 px-1">docs/schema.sql</code> 然后 <code className="mx-1 rounded bg-gray-100 px-1">docs/fix-profiles-missing.sql</code></p>
            )}
            {profileError.code === "42501" && (
              <p className="text-gray-600"><b>权限拒绝 (RLS)。</b>请执行 <code className="mx-1 rounded bg-gray-100 px-1">docs/fix-profiles-missing.sql</code> 中的 Step 9</p>
            )}
            {profileError.code === "42703" && (
              <p className="text-gray-600"><b>列不存在。</b>请执行 <code className="mx-1 rounded bg-gray-100 px-1">docs/fix-profiles-missing.sql</code></p>
            )}
            {profileError.code === "PGRST116" && (
              <p className="text-gray-600"><b>无记录。</b>请执行 <code className="mx-1 rounded bg-gray-100 px-1">docs/fix-profiles-missing.sql</code></p>
            )}
            {!["42P01", "42501", "42703", "PGRST116", "EXCEPTION"].includes(profileError.code) && (
              <p className="text-gray-600"><b>未知错误。</b>请在 Supabase SQL Editor 手动运行：<code className="mx-1 rounded bg-gray-100 px-1 break-all">SELECT * FROM profiles WHERE id = '{user.id}';</code></p>
            )}
          </div>

          <div className="text-center">
            <Link href="/" className="inline-block rounded-xl bg-[#1a7f5a] px-5 py-2 text-[13px] font-medium text-white hover:bg-[#166b4b] transition-colors">返回首页</Link>
          </div>
        </div>
      </div>
    );
  }

  const showProfileWarning = !profile;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="bg-white rounded-2xl border border-[#f3f4f6] p-6 md:p-8">
        {showProfileWarning && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-700">
            ⚠️ 用户资料记录缺失，部分功能可能受限。请在 Supabase SQL Editor 执行 <code className="rounded bg-amber-100 px-1 text-[12px]">docs/fix-profiles-missing.sql</code>
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          <Avatar userId={user.id} avatarUrl={profile?.avatar_url} displayName={displayName} size={64} />
          <div>
            <h1 className="text-xl font-bold text-[#1f2937]">{displayName}</h1>
            <p className="text-[13px] text-[#9ca3af]">{user.email}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Link href="/orders" className="flex items-center gap-3 rounded-xl border border-[#f3f4f6] p-4 hover:bg-[#f9fafb] transition-colors">
            <svg className="h-5 w-5 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div>
              <p className="text-[14px] font-medium text-[#1f2937]">我的订单</p>
              <p className="text-[12px] text-[#9ca3af]">查看订单状态与物流</p>
            </div>
          </Link>
          <Link href="/profile/edit" className="flex items-center gap-3 rounded-xl border border-[#f3f4f6] p-4 hover:bg-[#f9fafb] transition-colors">
            <svg className="h-5 w-5 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div>
              <p className="text-[14px] font-medium text-[#1f2937]">个人信息</p>
              <p className="text-[12px] text-[#9ca3af]">编辑昵称、头像等</p>
            </div>
          </Link>
          <Link href="/cart" className="flex items-center gap-3 rounded-xl border border-[#f3f4f6] p-4 hover:bg-[#f9fafb] transition-colors">
            <svg className="h-5 w-5 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 003 3h4.5a3 3 0 003-3H7.5zM6.75 14.25l-1.5-6h13.5l-1.5 6H6.75zM9 17.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM19.5 17.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            </svg>
            <div>
              <p className="text-[14px] font-medium text-[#1f2937]">购物车</p>
              <p className="text-[12px] text-[#9ca3af]">查看待购买的个体</p>
            </div>
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-[#f3f4f6]">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
