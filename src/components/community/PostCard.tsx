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

// Single image with lazy loading and error fallback
function ThumbImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-300 ${className || ""}`}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className || ""}`} />;
}

// Multi-image grid component
function ImageGrid({ images, alt }: { images: string[]; alt: string }) {
  const count = images.length;
  const displayImages = images.slice(0, 3);
  const remaining = count - 3;

  // Layout: 1 image → single wide; 2 → side by side; 3 → left 2/3 + right 2 small
  return (
    <div className="w-full overflow-hidden rounded-t-xl md:rounded-xl bg-gray-100">
      {count === 1 && (
        <div className="relative w-full aspect-[4/3] md:aspect-[16/9]">
          <ThumbImage src={displayImages[0]} alt={alt} className="w-full h-full" />
        </div>
      )}

      {count === 2 && (
        <div className="flex gap-0.5 h-[160px] md:h-[200px]">
          {displayImages.map((url, i) => (
            <div key={i} className="relative flex-1 overflow-hidden">
              <ThumbImage src={url} alt={alt + " " + (i + 1)} className="w-full h-full" />
            </div>
          ))}
        </div>
      )}

      {count >= 3 && (
        <div className="flex gap-0.5 h-[180px] md:h-[220px]">
          {/* Left: first image (2/3 width) */}
          <div className="relative flex-[2] overflow-hidden">
            <ThumbImage src={displayImages[0]} alt={alt} className="w-full h-full" />
          </div>
          {/* Right: 2nd + 3rd stacked */}
          <div className="flex-[1] flex flex-col gap-0.5">
            <div className="relative flex-1 overflow-hidden">
              <ThumbImage src={displayImages[1]} alt={alt + " 2"} className="w-full h-full" />
            </div>
            <div className="relative flex-1 overflow-hidden">
              <ThumbImage src={displayImages[2]} alt={alt + " 3"} className="w-full h-full" />
              {remaining > 0 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white font-bold text-lg md:text-xl">+{remaining}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Shared meta bar: author + time + like/comment counts
function MetaBar({ post, mobile }: { post: CommunityPost; mobile?: boolean }) {
  const sz = mobile ? "text-[12px]" : "text-[13px]";
  return (
    <div className={`flex items-center gap-2 ${sz} text-[#9ca3af]`}>
      <Avatar userId={post.author_id} avatarUrl={post.author?.avatar_url} displayName={post.author?.display_name} size={mobile ? 20 : 22} />
      <span className="truncate">{post.author?.display_name || "匿名"}</span>
      <span className="text-[#e5e7eb]">·</span>
      <span className="shrink-0">{timeAgo(post.created_at)}</span>
      <span className="ml-auto flex items-center gap-2 shrink-0">
        <span className="flex items-center gap-0.5">
          <svg className="h-3 w-3 md:h-3.5 md:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          {post.like_count}
        </span>
        <span className="flex items-center gap-0.5">
          <svg className="h-3 w-3 md:h-3.5 md:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          {post.comment_count}
        </span>
        {!mobile && (
          <span className="flex items-center gap-0.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            {post.view_count}
          </span>
        )}
      </span>
    </div>
  );
}

export default function PostCard({ post }: { post: CommunityPost }) {
  const snippet = post.content.replace(/<[^>]*>/g, "").substring(0, 120);
  const hasImage = post.images && post.images.length > 0;

  return (
    <Link href={"/community/post/" + post.id} className="card-interactive block rounded-xl bg-white overflow-hidden">

      {/* ====== Mobile ====== */}
      <div className="md:hidden">
        {hasImage && <ImageGrid images={post.images} alt={post.title} />}
        <div className={hasImage ? "p-3" : "p-4"}>
          <div className="mb-1.5 flex flex-wrap gap-1">
            {post.is_pinned && <span className="inline-block rounded-full bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-600">📌</span>}
            {post.is_featured && <span className="inline-block rounded-full bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-600">⭐</span>}
          </div>
          <h3 className="text-[15px] font-semibold text-[#1f2937] line-clamp-2 leading-snug">{post.title}</h3>
          {!hasImage && snippet && <p className="mt-1 text-[13px] text-[#6b7280] line-clamp-2">{snippet}</p>}
          <div className="mt-2.5"><MetaBar post={post} mobile /></div>
        </div>
      </div>

      {/* ====== Desktop ====== */}
      <div className="hidden md:block">
        {/* Image grid (above text, full width - all layouts) */}
        {hasImage && <ImageGrid images={post.images} alt={post.title} />}

        <div className="p-5">
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {post.is_pinned && <span className="inline-block rounded-full bg-red-50 px-2 py-0.5 text-[12px] font-medium text-red-600">📌 置顶</span>}
            {post.is_featured && <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[12px] font-medium text-amber-600">⭐ 精华</span>}
          </div>
          <h3 className="text-[17px] font-semibold text-[#1f2937] line-clamp-1 hover:text-[#1a7f5a] transition-colors duration-200">{post.title}</h3>
          {snippet && <p className={"mt-1 text-[14px] text-[#6b7280] leading-relaxed " + (hasImage ? "line-clamp-1" : "line-clamp-2")}>{snippet}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <MetaBar post={post} />
          </div>

          {post.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {post.tags.map(tag => (
                <span key={tag.id} className="inline-block rounded-full border border-[#e5e7eb] bg-white px-2 py-0.5 text-[11px] font-medium text-[#6b7280]">{tag.name}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}