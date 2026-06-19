import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPostBySlug } from "@/lib/studio/blog";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "笔记不存在" };
  return { title: post.title + " — Sunrich Pet", description: post.excerpt };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <Link href="/blog" className="text-[13px] text-[#6b7280] hover:text-[#1a7f5a] mb-6 inline-block">&larr; 返回笔记列表</Link>
      <article>
        <h1 className="text-2xl md:text-3xl font-bold text-[#1f2937] mb-3">{post.title}</h1>
        <p className="text-[13px] text-[#9ca3af] mb-6">{post.published_at ? new Date(post.published_at).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" }) : ""}</p>
        {post.cover_image && (
          <div className="mb-8 overflow-hidden rounded-xl aspect-video bg-gray-100">
            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="prose prose-lg max-w-none text-[15px] leading-relaxed text-[#4b5563] whitespace-pre-wrap">{post.content}</div>
      </article>
    </div>
  );
}
