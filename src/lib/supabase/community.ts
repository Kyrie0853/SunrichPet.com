import { createClient } from '@/lib/supabase/server';
import type { CommunityPost, CommunityCategory, SortOption } from '@/lib/supabase/community-types';

export type { CommunityPost, CommunityCategory, SortOption };
export { CATEGORY_LABELS, SORT_OPTIONS } from '@/lib/supabase/community-types';

// 获取帖子列表（分步查询，避免跨 schema FK 解析失败）
export async function getPosts(options: {category?:CommunityCategory;sort?:SortOption;page?:number;pageSize?:number}) {
  const {category,sort="latest",page=1,pageSize=12}=options;
  const supabase=await createClient();
  let query=supabase.from("community_posts").select("*",{count:"estimated"});
  if(category)query=query.eq("category",category);
  if(sort==="latest")query=query.order("is_pinned",{ascending:false}).order("created_at",{ascending:false});
  else if(sort==="hot")query=query.order("is_pinned",{ascending:false}).order("view_count",{ascending:false});
  else if(sort==="trending"){const d=new Date(Date.now()-7*24*60*60*1000).toISOString();query=query.gte("created_at",d).order("view_count",{ascending:false});}
  query=query.range((page-1)*pageSize,page*pageSize-1);
  const {data:posts,error,count}=await query;
  if(error||!posts||posts.length===0)return {posts:[],total:count||0};
  // 批量获取作者信息
  const authorIds=[...new Set(posts.map(p=>p.author_id))];
  const {data:authors}=await supabase.from("profiles").select("id,display_name,avatar_url").in("id",authorIds);
  const authorMap=new Map((authors||[]).map(a=>[a.id,a]));
  // 批量获取标签
  const postIds=posts.map(p=>p.id);
  const {data:tagRels}=await supabase.from("community_post_tags").select("post_id,tag_id").in("post_id",postIds);
  const tagIds=[...new Set((tagRels||[]).map(r=>r.tag_id))];
  let tagMap=new Map<string,any[]>();
  if(tagIds.length>0){
    const {data:tags}=await supabase.from("community_tags").select("id,name,slug,color").in("id",tagIds);
    const tagById=new Map((tags||[]).map(t=>[t.id,t]));
    (tagRels||[]).forEach(r=>{if(tagById.has(r.tag_id)){if(!tagMap.has(r.post_id))tagMap.set(r.post_id,[]);tagMap.get(r.post_id)!.push(tagById.get(r.tag_id)!);}});
  }
  // 批量获取点赞和评论数
  const [likeCounts,commentCounts]=await Promise.all([
    Promise.all(postIds.map(id=>supabase.from("community_likes").select("*",{count:"exact",head:true}).eq("post_id",id))),
    Promise.all(postIds.map(id=>supabase.from("community_comments").select("*",{count:"exact",head:true}).eq("post_id",id)))
  ]);
  const result=posts.map((p,i)=>({...p,author:authorMap.get(p.author_id)||null,tags:tagMap.get(p.id)||[],like_count:(likeCounts[i]as any).count||0,comment_count:(commentCounts[i]as any).count||0}));
  return {posts:result as CommunityPost[],total:count||0};
}

export async function getPost(postId:string){
  const supabase=await createClient();
  // 并行：获取帖子+作者+标签+计数
  const {data:post,error}=await supabase.from("community_posts").select("*").eq("id",postId).single();
  if(error){console.error("getPost error:",error);return null;}
  if(!post)return null;
  const [authorRes,tagRels,likeRes,commentRes]=await Promise.all([
    supabase.from("profiles").select("id,display_name,avatar_url").eq("id",post.author_id).single(),
    supabase.from("community_post_tags").select("tag_id").eq("post_id",postId),
    supabase.from("community_likes").select("*",{count:"exact",head:true}).eq("post_id",postId),
    supabase.from("community_comments").select("*",{count:"exact",head:true}).eq("post_id",postId),
  ]);
  let tags:any[]=[];
  if(tagRels.data&&tagRels.data.length>0){
    const tIds=tagRels.data.map(r=>r.tag_id);
    const {data:tagData}=await supabase.from("community_tags").select("id,name,slug,color").in("id",tIds);
    tags=tagData||[];
  }
  // 异步增加浏览量（fire-and-forget）
  supabase.from("community_posts").update({view_count:(post.view_count||0)+1}).eq("id",postId).then(()=>{},()=>{});
  return {...post,author:authorRes.data||null,tags,like_count:likeRes.count||0,comment_count:commentRes.count||0} as CommunityPost;
}

export async function getComments(postId:string){
  const supabase=await createClient();
  const {data:comments,error}=await supabase.from("community_comments").select("*").eq("post_id",postId).is("parent_id",null).order("created_at",{ascending:true});
  if(error||!comments||comments.length===0)return [];
  // 批量获取评论作者
  const authorIds=[...new Set(comments.map(c=>c.author_id))];
  const {data:authors}=await supabase.from("profiles").select("id,display_name,avatar_url").in("id",authorIds);
  const authorMap=new Map((authors||[]).map(a=>[a.id,a]));
  // 获取嵌套回复
  const commentIds=comments.map(c=>c.id);
  const {data:replies}=await supabase.from("community_comments").select("*").in("parent_id",commentIds).order("created_at",{ascending:true});
  const replyAuthorIds=[...new Set((replies||[]).map(r=>r.author_id))];
  if(replyAuthorIds.length>0){
    const {data:replyAuthors}=await supabase.from("profiles").select("id,display_name,avatar_url").in("id",replyAuthorIds);
    (replyAuthors||[]).forEach(a=>authorMap.set(a.id,a));
  }
  const replyMap=new Map<string,any[]>();
  (replies||[]).forEach(r=>{const pid=r.parent_id;if(!replyMap.has(pid))replyMap.set(pid,[]);replyMap.get(pid)!.push(r);});
  return comments.map(c=>({...c,author:authorMap.get(c.author_id)||null,replies:(replyMap.get(c.id)||[]).map((r:any)=>({...r,author:authorMap.get(r.author_id)||null}))}));
}

export async function getUserProfile(userId:string){
  const supabase=await createClient();
  const {data:profile}=await supabase.from("profiles").select("*").eq("id",userId).single();
  if(!profile)return null;
  const [{count:followingCount},{count:followerCount},{data:posts}]=await Promise.all([
    supabase.from("user_follows").select("*",{count:"exact",head:true}).eq("follower_id",userId),
    supabase.from("user_follows").select("*",{count:"exact",head:true}).eq("following_id",userId),
    supabase.from("community_posts").select("id,title,created_at,view_count").eq("author_id",userId).order("created_at",{ascending:false}).limit(20),
  ]);
  return {...profile,following_count:followingCount||0,follower_count:followerCount||0,posts:posts||[]};
}

export async function getNotifications(userId: string, page = 1) {
  const supabase = await createClient();
  const { data: notifs, count } = await supabase.from("notifications").select("*", { count: "estimated" }).eq("user_id", userId).order("created_at", { ascending: false }).range((page-1)*20, page*20-1);
  if (!notifs || notifs.length === 0) return { notifications: [], total: count || 0 };
  const actorIds = [...new Set(notifs.map((n: any) => n.actor_id).filter(Boolean))];
  const { data: actors } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", actorIds);
  const actorMap = new Map((actors || []).map((a: any) => [a.id, a]));
  const enriched = notifs.map((n: any) => ({ ...n, actor: actorMap.get(n.actor_id) || null }));
  return { notifications: enriched, total: count || 0 };
}
export async function markNotificationsRead(userId: string) {
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
}
export async function getUserFavorites(userId:string){
  const supabase=await createClient();
  const {data:favs}=await supabase.from("community_favorites").select("post_id,created_at").eq("user_id",userId).order("created_at",{ascending:false}).limit(50);
  if(!favs||favs.length===0)return [];
  const postIds=favs.map(f=>f.post_id);
  const {data:posts}=await supabase.from("community_posts").select("id,title,created_at,view_count,author_id").in("id",postIds);
  if(!posts)return [];
  const authorIds=[...new Set(posts.map(p=>p.author_id))];
  const {data:authors}=await supabase.from("profiles").select("id,display_name,avatar_url").in("id",authorIds);
  const aMap=new Map((authors||[]).map(a=>[a.id,a]));
  return posts.map(p=>({...p,author:aMap.get(p.author_id)||null,favorited_at:favs.find(f=>f.post_id===p.id)?.created_at}));
}
export async function getUserLikes(userId:string){
  const supabase=await createClient();
  const {data:likes}=await supabase.from("community_likes").select("post_id,created_at").eq("user_id",userId).order("created_at",{ascending:false}).limit(50);
  if(!likes||likes.length===0)return [];
  const postIds=[...new Set(likes.map(l=>l.post_id).filter(Boolean))];
  if(postIds.length===0)return [];
  const {data:posts}=await supabase.from("community_posts").select("id,title,created_at,view_count,author_id").in("id",postIds);
  if(!posts)return [];
  const authorIds=[...new Set(posts.map(p=>p.author_id))];
  const {data:authors}=await supabase.from("profiles").select("id,display_name,avatar_url").in("id",authorIds);
  const aMap=new Map((authors||[]).map(a=>[a.id,a]));
  return posts.map(p=>({...p,author:aMap.get(p.author_id)||null,liked_at:likes.find(l=>l.post_id===p.id)?.created_at}));
}
