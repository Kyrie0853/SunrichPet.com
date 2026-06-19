import Link from "next/link";
import { getAllBlogPosts } from "@/lib/studio/blog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "繁育笔记 — Sunrich Pet 爬宠工作室",
  description: "记录爬宠繁育点滴，分享饲养经验和心得。",
};

export default async function BlogPage() {
  const posts = await getAllBlogPosts();
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-bold text-[#1f2937] mb-2">繁育笔记</h1>
      <p className="text-[14px] text-[#6b7280] mb-8">记录繁育点滴，分享饲养心得</p>
      {posts.length === 0 ? (
        <div className="py-20 text-center"><p className="text-5xl mb-4">📝</p><p className="text-[#9ca3af] text-[15px]">笔记即将上线</p></div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}
              className="block bg-white rounded-xl border border-[#f3f4f6] p-5 hover:border-[#1a7f5a]/20 hover:shadow-sm transition-all group">
              {post.cover_image && (
                <div className="mb-4 overflow-hidden rounded-xl aspect-video bg-gray-100">
                  <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>
              )}
              <h2 className="text-[17px] md:text-[19px] font-semibold text-[#1f2937] group-hover:text-[#1a7f5a] transition-colors">{post.title}</h2>
              {post.excerpt && <p className="mt-2 text-[13px] text-[#6b7280] line-clamp-2">{post.excerpt}</p>}
              <p className="mt-3 text-[12px] text-[#9ca3af]">{post.published_at ? new Date(post.published_at).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" }) : ""}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
