import { getPost, getComments } from "@/lib/supabase/community";
import { notFound } from "next/navigation";
import PostDetail from "@/components/community/PostDetail";
import CommentSection from "@/components/community/CommentSection";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return { title: "帖子未找到" };
  return { title: post.title + " - Sunrich Pet 社区" };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();
  const comments = await getComments(id);
  return (<div className="mx-auto max-w-4xl px-4 py-10"><Link href="/community" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-700">&larr; 返回社区</Link><PostDetail post={post} /><div className="mt-12"><h2 className="mb-6 text-xl font-bold text-gray-900">评论 ({post.comment_count})</h2><CommentSection postId={id} initialComments={comments} postAuthorId={post.author_id} /></div></div>);
}