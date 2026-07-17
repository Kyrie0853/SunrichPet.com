import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPostBySlug, renderMarkdown } from "@/lib/studio/blog";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "笔记不存在" };
  return {
    title: post.title + " — 给我爬",
    description: post.excerpt,
    openGraph: post.cover_image ? { images: [post.cover_image] } : undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const contentHtml = await renderMarkdown(post.content);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <Link href="/blog" className="text-[13px] text-[#6b7280] hover:text-[#1a7f5a] mb-6 inline-block">&larr; 返回笔记列表</Link>
      <article>
        <h1 className="text-2xl md:text-3xl font-bold text-[#1f2937] mb-3">{post.title}</h1>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-[13px] text-[#9ca3af]">{post.published_at ? new Date(post.published_at).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" }) : ""}</p>
          {(post.tags || []).length > 0 && (
            <div className="flex gap-1">
              {(post.tags || []).map((tag: string) => (
                <span key={tag} className="rounded-full bg-[#e8f5ef] px-2 py-0.5 text-[11px] text-[#1a7f5a]">{tag}</span>
              ))}
            </div>
          )}
        </div>
        {post.cover_image && (
          <div className="mb-8 overflow-hidden rounded-xl aspect-video bg-gray-100">
            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div
          className="prose prose-lg max-w-none text-[15px] leading-relaxed text-[#4b5563]
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[#1f2937] [&_h1]:mt-8 [&_h1]:mb-4
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#1f2937] [&_h2]:mt-6 [&_h2]:mb-3
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[#1f2937] [&_h3]:mt-5 [&_h3]:mb-2
            [&_p]:mb-4 [&_p]:leading-relaxed
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
            [&_li]:mb-1.5 [&_blockquote]:border-l-4 [&_blockquote]:border-[#1a7f5a]/30 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:text-[#6b7280] [&_blockquote]:italic [&_blockquote]:mb-4
            [&_code]:bg-[#f3f4f6] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_code]:text-[#e53e3e]
            [&_pre]:bg-[#1e293b] [&_pre]:text-[#e2e8f0] [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:mb-4 [&_pre]:text-[13px]
            [&_img]:rounded-xl [&_img]:my-6 [&_img]:max-w-full
            [&_a]:text-[#1a7f5a] [&_a]:underline [&_a]:decoration-[#1a7f5a]/30 [&_a]:hover:decoration-[#1a7f5a]
            [&_hr]:my-8 [&_hr]:border-[#e5e7eb]
            [&_strong]:font-bold [&_em]:italic
          "
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>
    </div>
  );
}
