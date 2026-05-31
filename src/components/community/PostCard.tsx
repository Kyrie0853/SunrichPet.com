"use client";

import Link from "next/link";
import { CommunityPost } from "@/lib/supabase/community-types";
import Avatar from "@/components/Avatar";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return mins + " 分钟前";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + " 小时前";
  const days = Math.floor(hours / 24);
  if (days < 30) return days + " 天前";
  const months = Math.floor(days / 30);
  if (months < 12) return months + " 个月前";
  return Math.floor(months / 12) + " 年前";
}

export default function PostCard({ post }: { post: CommunityPost }) {
  const snippet = post.content.replace(/<[^>]*>/g, "").substring(0, 120);
  

  return (
    <article className="card-interactive rounded-xl bg-white p-4 md:p-5">
      {/* 标签 */}
      <div className="mb-2 flex flex-wrap gap-1.5">
        {post.is_pinned && (
          <span className="inline-block rounded-full bg-red-50 px-2 py-0.5 text-[12px] font-medium text-red-600">📌 置顶</span>
        )}
        {post.is_featured && (
          <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[12px] font-medium text-amber-600">⭐ 精华</span>
        )}
      </div>

      {/* 标题行 */}
      <div className="flex items-start gap-3">
        <Avatar userId={post.author_id} avatarUrl={post.author?.avatar_url} displayName={post.author?.display_name} size={40} clickable />

        <div className="min-w-0 flex-1">
          <Link href={"/community/post/" + post.id} className="block">
            <h3 className="text-[18px] font-semibold text-[#1f2937] line-clamp-1 hover:text-[#1a7f5a] transition-colors duration-200">
              {post.title}
            </h3>
          </Link>
          <p className="mt-1 text-[15px] text-[#6b7280] line-clamp-2 leading-relaxed">{snippet}</p>
        </div>
      </div>

      {/* 底部信息 */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-[#9ca3af]">
        <span>{post.author?.display_name || "匿名用户"}</span>
        <span className="text-[#e5e7eb]">·</span>
        <span>{timeAgo(post.created_at)}</span>
        <span className="ml-auto flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          {post.like_count}
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          {post.comment_count}
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          {post.view_count}
        </span>
      </div>

      {/* 标签 */}
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-block rounded-full border border-[#e5e7eb] bg-white px-2.5 py-0.5 text-[12px] font-medium text-[#6b7280]"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}