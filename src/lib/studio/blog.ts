import { createClient } from "@/lib/supabase/server";
import { marked } from "marked";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  tags: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getLatestBlogPosts(limit = 3) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data || []) as BlogPost[];
}

export async function getBlogPostBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  return data as BlogPost;
}

export async function getAllBlogPosts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .order("published_at", { ascending: false });
  return (data || []) as BlogPost[];
}

export async function getAllBlogPostsAdmin() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });
  return (data || []) as BlogPost[];
}

export async function createBlogPost(data: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  tags?: string[];
  published_at?: string | null;
}) {
  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from("blog_posts")
    .insert({
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt || data.content.slice(0, 160),
      cover_image: data.cover_image || null,
      tags: data.tags || [],
      published_at: data.published_at || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return result;
}

export async function updateBlogPost(id: string, data: {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  cover_image?: string;
  tags?: string[];
  published_at?: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("blog_posts")
    .update(data)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteBlogPost(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function renderMarkdown(content: string): Promise<string> {
  const html = await marked(content, { breaks: true, gfm: true });
  return html;
}
