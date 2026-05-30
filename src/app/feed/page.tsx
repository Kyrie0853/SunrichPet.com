import { getFeed } from "@/lib/supabase/community";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PostCard from "@/components/community/PostCard";
import Link from "next/link";

export const metadata = { title: "动态 — 顺瑞益宠" };

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { posts } = await getFeed(user.id);
  const { data: profiles } = await supabase.from("profiles").select("id,display_name,avatar_url");
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  return (
    <div className="mx-auto max-w-3xl md:px-4 px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">我的动态</h1>
      <p className="mb-8 text-sm text-gray-500">你关注的人发布的最新帖子</p>

      {posts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl">📭</p>
          <p className="mt-4 text-gray-400">暂无动态，去关注一些宠友吧</p>
          <Link href="/" className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">浏览论坛</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post: any) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
