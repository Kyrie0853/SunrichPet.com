import { createClient } from "@/lib/supabase/server";
import type { CommunityPost } from "@/lib/supabase/community-types";

export async function searchPosts(query:string,page=1){
  const supabase=await createClient();
  const term=`%${query}%`;
  const filter=`title.ilike.${term},content.ilike.${term}`;
  const {data:posts,count}=await supabase.from("community_posts").select("*",{count:"estimated"}).or(filter).order("created_at",{ascending:false}).range((page-1)*10,page*10-1);
  if(!posts||posts.length===0)return {posts:[],total:0};
  const aIds=[...new Set(posts.map(p=>p.author_id))];
  const {data:authors}=await supabase.from("profiles").select("id,display_name,avatar_url").in("id",aIds);
  const aMap=new Map((authors||[]).map(a=>[a.id,a]));
  const enriched=await Promise.all(posts.map(async p=>{const[lk,cm]=await Promise.all([supabase.from("community_likes").select("*",{count:"exact",head:true}).eq("post_id",p.id),supabase.from("community_comments").select("*",{count:"exact",head:true}).eq("post_id",p.id)]);return {...p,author:aMap.get(p.author_id)||null,like_count:(lk as any).count||0,comment_count:(cm as any).count||0};}));
  return {posts:enriched as CommunityPost[],total:count||0};
}
export async function searchProducts(query:string,page=1){
  const supabase=await createClient();
  const term2=`%${query}%`;
  const filter2=`name.ilike.${term2},description.ilike.${term2}`;
  const {data:products,count}=await supabase.from("products").select("*",{count:"estimated"}).or(filter2).eq("status","active").order("created_at",{ascending:false}).range((page-1)*10,page*10-1);
  return {products:products||[],total:count||0};
}

export async function searchUsers(query: string, currentUserId?: string, page = 1) {
  const supabase = await createClient();
  const term = `%${query}%`;
  const { data: users, count } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio, points, level")
    .ilike("display_name", term)
    .order("display_name", { ascending: true })
    .range((page - 1) * 20, page * 20 - 1);

  if (!users || users.length === 0) return { users: [], total: 0 };

  // 排除当前用户自己
  const filtered = currentUserId ? users.filter(u => u.id !== currentUserId) : users;
  // 获取关注状态
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
}
