"use client";

import { useState } from "react";
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

function PostImage({ url, total, alt }: { url: string; total: number; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex items-center justify-center bg-gray-100 text-gray-300 rounded-xl w-full h-full min-h-[80px]">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      </div>
    );
  }
  return (
    <div className="relative w-full h-full">
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-full h-full object-cover"
      />
      {total > 1 && (
        <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
          +{total - 1}
        </span>
      )}
    </div>
  );
}

export default function PostCard({ post }: { post: CommunityPost }) {
  const snippet = post.content.replace(/<[^>]*>/g, "").substring(0, 120);
  const hasImage = post.images && post.images.length > 0;
  const firstImage = hasImage ? post.images[0] : null;

  return (
    <Link
      href={"/community/post/" + post.id}
      className="card-interactive block rounded-xl bg-white"
    >
      {/* ====== Mobile layout: image on top, text below ====== */}
      <div className="md:hidden">
        {/* Image (top) */}
        {firstImage && (
          <div className="w-full aspect-[16/9] overflow-hidden rounded-t-xl bg-gray-100">
            <PostImage url={firstImage} total={post.images.length} alt={post.title} />
          </div>
        )}

        {/* Content (bottom) */}
        <div className={hasImage ? "p-3" : "p-4"}>
          {/* Badges */}
          <div className="mb-1.5 flex flex-wrap gap-1">
            {post.is_pinned && <span className="inline-block rounded-full bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-600">📌 置顶</span>}
            {post.is_featured && <span className="inline-block rounded-full bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-600">⭐ 精华</span>}
          </div>
          <h3 className="text-[15px] font-semibold text-[#1f2937] line-clamp-2 leading-snug">{post.title}</h3>
          {!hasImage && snippet && <p className="mt-1 text-[13px] text-[#6b7280] line-clamp-2 leading-relaxed">{snippet}</p>}
          <div className="mt-2.5 flex items-center gap-2 text-[12px] text-[#9ca3af]">
            <Avatar userId={post.author_id} avatarUrl={post.author?.avatar_url} displayName={post.author?.display_name} size={20} />
            <span className="truncate">{post.author?.display_name || "匿名"}</span>
            <span className="text-[#e5e7eb]">·</span>
            <span className="shrink-0">{timeAgo(post.created_at)}</span>
            <span className="ml-auto flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-0.5"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>{post.like_count}</span>
              <span className="flex items-center gap-0.5"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>{post.comment_count}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ====== Desktop layout: left image + right text ====== */}
      <div className="hidden md:flex">
        {/* Image (left) */}
        {firstImage && (
          <div className="w-[35%] max-w-[200px] shrink-0 overflow-hidden rounded-l-xl bg-gray-100">
            <div className="aspect-square">
              <PostImage url={firstImage} total={post.images.length} alt={post.title} />
            </div>
          </div>
        )}

        {/* Content (right) */}
        <div className={"flex-1 min-w-0 " + (hasImage ? "p-5" : "p-5")}>
          {/* Badges */}
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {post.is_pinned && <span className="inline-block rounded-full bg-red-50 px-2 py-0.5 text-[12px] font-medium text-red-600">📌 置顶</span>}
            {post.is_featured && <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[12px] font-medium text-amber-600">⭐ 精华</span>}
          </div>

          <h3 className="text-[17px] font-semibold text-[#1f2937] line-clamp-1 hover:text-[#1a7f5a] transition-colors duration-200">
            {post.title}
          </h3>

          {snippet && (
            <p className={"mt-1 text-[14px] text-[#6b7280] leading-relaxed " + (hasImage ? "line-clamp-1" : "line-clamp-2")}>
              {snippet}
            </p>
          )}

          {/* Bottom info */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-[#9ca3af]">
            <div className="flex items-center gap-1.5">
              <Avatar userId={post.author_id} avatarUrl={post.author?.avatar_url} displayName={post.author?.display_name} size={22} />
              <span className="truncate max-w-[120px]">{post.author?.display_name || "匿名用户"}</span>
            </div>
            <span className="text-[#e5e7eb]">·</span>
            <span className="shrink-0">{timeAgo(post.created_at)}</span>
            <span className="ml-auto flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                {post.like_count}
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                {post.comment_count}
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                {post.view_count}
              </span>
            </span>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span key={tag.id} className="inline-block rounded-full border border-[#e5e7eb] bg-white px-2 py-0.5 text-[11px] font-medium text-[#6b7280]">
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}