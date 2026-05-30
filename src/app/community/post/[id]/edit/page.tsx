import { getPost } from "@/lib/supabase/community";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import EditPostForm from "@/components/community/EditPostForm";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const post = await getPost(id);
  if (!post) notFound();
  if (post.author_id !== user.id) redirect("/community/post/"+id);

  return (<div className="mx-auto max-w-3xl px-4 py-10"><h1 className="mb-8 text-3xl font-bold text-gray-900">编辑帖子</h1><EditPostForm post={post} /></div>);
}