import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "社区 — 顺瑞益宠" };

export default async function BarsPage() {
  const supabase = await createClient();
  const { data: bars } = await supabase
    .from("bars")
    .select("*")
    .eq("is_active", true)
    .order("member_count", { ascending: false });

  const { data: { user } } = await supabase.auth.getUser();
  let userBars: Set<string> = new Set();
  if (user && bars?.length) {
    const { data: memberships } = await supabase
      .from("bar_members")
      .select("bar_id")
      .eq("user_id", user.id)
      .in("bar_id", bars.map(b => b.id));
    userBars = new Set((memberships || []).map(m => m.bar_id));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">宠物社区</h1>
      <p className="mb-8 text-gray-500">选择你感兴趣的社区，与同好一起交流</p>

      {!bars?.length ? (
        <div className="py-20 text-center">
          <p className="text-4xl mb-3">🏗️</p>
          <p className="text-gray-500 mb-2">社区正在搭建中，请稍后再来</p>
          <p className="text-sm text-gray-400">管理员正在配置社区分类</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bars.map((bar: any) => (
            <Link
              key={bar.id}
              href={"/b/" + bar.slug}
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-emerald-200"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
                  {bar.icon || "🐾"}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition">
                    {bar.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {bar.description || "暂无简介"}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                    <span>👥 {bar.member_count || 0} 成员</span>
                    <span>📝 {bar.post_count || 0} 帖子</span>
                    {userBars.has(bar.id) && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-600 font-medium">
                        已加入
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
