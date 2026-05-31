import { cache } from 'react';
import { createClient } from "@/lib/supabase/server";
import type { CommunityPost } from "@/lib/supabase/community-types";

const _cached = <T extends (...args: any[]) => any>(fn: T): T => cache(fn) as unknown as T;

export const searchPosts = _cached(async function searchPosts(query:string,page=1){
  const supabase=await createClient();
  const term=`%${query}%`;
  const filter=`title.ilike.${term},content.ilike.${term}`;
  const {data:posts,count}=await supabase.from("community_posts").select("*",{count:"estimated"}).or(filter).order("created_at",{ascending:false}).range((page-1)*10,page*10-1);
  if(!posts||posts.length===0)return {posts:[],total:0};

  // 🚀 批量计数替代 N+1
  const postIds=posts.map(p=>p.id);
  const aIds=[...new Set(posts.map(p=>p.author_id))];
  const [authorsRes,likesRes,commentsRes]=await Promise.all([
    supabase.from("profiles").select("id,display_name,avatar_url").in("id",aIds),
    supabase.from("community_likes").select("post_id").in("post_id",postIds),
    supabase.from("community_comments").select("post_id").in("post_id",postIds),
  ]);

  const aMap=new Map((authorsRes.data||[]).map(a=>[a.id,a]));
  const likeMap=new Map<string,number>();
  (likesRes.data||[]).forEach((l:any)=>{likeMap.set(l.post_id,(likeMap.get(l.post_id)||0)+1)});
  const cmtMap=new Map<string,number>();
  (commentsRes.data||[]).forEach((c:any)=>{cmtMap.set(c.post_id,(cmtMap.get(c.post_id)||0)+1)});

  const enriched=posts.map(p=>({...p,author:aMap.get(p.author_id)||null,like_count:likeMap.get(p.id)||0,comment_count:cmtMap.get(p.id)||0}));
  return {posts:enriched as CommunityPost[],total:count||0};
});

export const searchProducts = _cached(async function searchProducts(query:string,page=1){
  const supabase=await createClient();
  const term2=`%${query}%`;
  const filter2=`name.ilike.${term2},description.ilike.${term2}`;
  const {data:products,count}=await supabase.from("products").select("*",{count:"estimated"}).or(filter2).eq("status","active").order("created_at",{ascending:false}).range((page-1)*10,page*10-1);
  return {products:products||[],total:count||0};
});

export const searchUsers = _cached(async function searchUsers(query: string, currentUserId?: string, page = 1) {
  const supabase = await createClient();
  const term = `%${query}%`;
  const { data: users, count } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio, points, level")
    .ilike("display_name", term)
    .order("display_name", { ascending: true })
    .range((page - 1) * 20, page * 20 - 1);

  if (!users || users.length === 0) return { users: [], total: 0 };

  const filtered = currentUserId ? users.filter(u => u.id !== currentUserId) : users;
  let followingSet = new Set<string>();
  if (currentUserId && filtered.length > 0) {
    const ids = filtered.map(u => u.id);
    const { data: follows } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", currentUserId)
      .in("following_id", ids);
    followingSet = new Set((follows || []).map(f => f.following_id));
  }

  return {
    users: filtered.map(u => ({ ...u, isFollowing: followingSet.has(u.id) })),
    total: count || 0,
  };
});

export const searchBars = _cached(async function searchBars(query: string, page = 1) {
  const supabase = await createClient();
  const term = `%${query}%`;
  const { data: bars, count } = await supabase
    .from("bars")
    .select("*", { count: "estimated" })
    .ilike("name", term)
    .order("member_count", { ascending: false })
    .range((page - 1) * 20, page * 20 - 1);

  return { bars: bars || [], total: count || 0 };
});
