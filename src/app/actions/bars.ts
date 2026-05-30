"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// 获取所有吧
export async function getBars() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bars")
    .select("*")
    .order("member_count", { ascending: false });
  return data || [];
}

// 获取吧详情
export async function getBarBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bars")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
}

// 获取吧内帖子
export async function getBarPosts(barId: string, options: { sort?: string; page?: number } = {}) {
  const supabase = await createClient();
  const { sort = "latest", page = 1 } = options;
  const pageSize = 12;

  let query = supabase
    .from("community_posts")
    .select("*", { count: "estimated" })
    .eq("bar_id", barId);

  if (sort === "latest") query = query.order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
  else if (sort === "hot") query = query.order("is_pinned", { ascending: false }).order("view_count", { ascending: false });

  query = query.range((page - 1) * pageSize, page * pageSize - 1);
  const { data: posts, count } = await query;
  if (!posts?.length) return { posts: [], total: 0 };

  const authorIds = [...new Set(posts.map(p => p.author_id))];
  const { data: authors } = await supabase.from("profiles").select("id,display_name,avatar_url").in("id", authorIds);
  const aMap = new Map((authors || []).map(a => [a.id, a]));

  const enriched = await Promise.all(posts.map(async p => {
    const [lk, cm] = await Promise.all([
      supabase.from("community_likes").select("*", { count: "exact", head: true }).eq("post_id", p.id),
      supabase.from("community_comments").select("*", { count: "exact", head: true }).eq("post_id", p.id),
    ]);
    return { ...p, author: aMap.get(p.author_id) || null, like_count: (lk as any).count || 0, comment_count: (cm as any).count || 0 };
  }));

  return { posts: enriched, total: count || 0 };
}

// 加入吧
export async function joinBar(barId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "请先登录" };

  const { error } = await supabase.from("bar_members").insert({ bar_id: barId, user_id: user.id });
  if (error && error.code !== "23505") return { success: false, message: error.message };

  revalidatePath("/b");
  revalidatePath("/b/*");
  return { success: true, message: "已加入" };
}

// 退出吧
export async function leaveBar(barId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "请先登录" };

  const { error } = await supabase.from("bar_members").delete().eq("bar_id", barId).eq("user_id", user.id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/b");
  revalidatePath("/b/*");
  return { success: true, message: "已退出" };
}

// 检查是否已加入
export async function isBarMember(barId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase.from("bar_members").select("id").eq("bar_id", barId).eq("user_id", user.id).maybeSingle();
  return !!data;
}

// 获取用户加入的吧
export async function getUserBars(userId: string) {
  const supabase = await createClient();
  const { data: memberships } = await supabase.from("bar_members").select("bar_id").eq("user_id", userId);
  if (!memberships?.length) return [];

  const barIds = memberships.map(m => m.bar_id);
  const { data: bars } = await supabase.from("bars").select("*").in("id", barIds).order("member_count", { ascending: false });
  return bars || [];
}
