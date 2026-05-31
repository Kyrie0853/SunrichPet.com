import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { CommunityPost, SortOption } from '@/lib/supabase/community-types';

export type { CommunityPost, SortOption };
export { SORT_OPTIONS } from '@/lib/supabase/community-types';

// ============================================================
// 性能优化：请求级缓存 — 同一 HTTP 请求中重复调用返回缓存结果
// ============================================================
const _cached = <T extends (...args: any[]) => any>(fn: T): T => cache(fn) as unknown as T;

// ============================================================
// 性能优化：批量获取互动计数（替代 N+1 逐条查询）
// ============================================================
async function batchCounts(supabase: Awaited<ReturnType<typeof createClient>>, table: string, postIds: string[]) {
  if (postIds.length === 0) return new Map<string, number>();
  // 一次查询获取所有帖子的计数，JS 端聚合
  const { data } = await supabase.from(table).select("post_id").in("post_id", postIds);
  const countMap = new Map<string, number>();
  (data || []).forEach((row: any) => {
    countMap.set(row.post_id, (countMap.get(row.post_id) || 0) + 1);
  });
  // 确保所有 postId 都在 map 中（即使计数为 0）
  postIds.forEach(id => { if (!countMap.has(id)) countMap.set(id, 0); });
  return countMap;
}

// 获取热门帖子（跨吧聚合，用于热门广场首页）
export const getHotPosts = _cached(async function getHotPosts(options: { page?: number; pageSize?: number } = {}) {
  const { page = 1, pageSize = 12 } = options;
  const supabase = await createClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: posts, error, count } = await supabase
    .from("community_posts")
    .select("*", { count: "estimated" })
    .or(`created_at.gte.${thirtyDaysAgo},is_pinned.eq.true`)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error || !posts || posts.length === 0) return { posts: [], total: count || 0 };

  const postIds = posts.map(p => p.id);
  const authorIds = [...new Set(posts.map(p => p.author_id))];
  const barIds = [...new Set(posts.map(p => p.bar_id).filter(Boolean))];

  // 🚀 优化：并行批量查询
  const [authorsRes, barRes, likeCounts, commentCounts] = await Promise.all([
    supabase.from("profiles").select("id,display_name,avatar_url").in("id", authorIds),
    barIds.length > 0
      ? supabase.from("bars").select("id,name,slug,icon").in("id", barIds).eq("is_active", true)
      : Promise.resolve({ data: [] }),
    batchCounts(supabase, "community_likes", postIds),
    batchCounts(supabase, "community_comments", postIds),
  ]);

  const authorMap = new Map((authorsRes.data || []).map(a => [a.id, a]));
  const barMap = new Map<string, any>();
  (barRes.data || []).forEach(b => barMap.set(b.id, b));

  const result = posts.map(p => {
    const lc = likeCounts.get(p.id) || 0;
    const cc = commentCounts.get(p.id) || 0;
    const daysSinceCreation = (Date.now() - new Date(p.created_at).getTime()) / (24 * 60 * 60 * 1000);
    const timeDecay = daysSinceCreation <= 7 ? 2.0 : daysSinceCreation <= 30 ? 1.0 : 0.5;
    const hotScore = (lc * 3 + cc * 2 + (p.view_count || 0) * 1) * timeDecay;
    return {
      ...p,
      author: authorMap.get(p.author_id) || null,
      bar: barMap.get(p.bar_id) || null,
      like_count: lc,
      comment_count: cc,
      hot_score: Math.round(hotScore),
    };
  });

  result.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1;
    return b.hot_score - a.hot_score;
  });

  return { posts: result as CommunityPost[], total: count || 0 };
});

// 获取帖子列表（分步查询，避免跨 schema FK 解析失败）
export const getPosts = _cached(async function getPosts(options: {category?:string;sort?:SortOption;page?:number;pageSize?:number}) {
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

  const postIds=posts.map(p=>p.id);
  const authorIds=[...new Set(posts.map(p=>p.author_id))];

  // 🚀 批量：authors + tags + counts 并行
  const [authorsRes,tagRels,likeCounts,commentCounts]=await Promise.all([
    supabase.from("profiles").select("id,display_name,avatar_url").in("id",authorIds),
    supabase.from("community_post_tags").select("post_id,tag_id").in("post_id",postIds),
    batchCounts(supabase,"community_likes",postIds),
    batchCounts(supabase,"community_comments",postIds),
  ]);

  const authorMap=new Map((authorsRes.data||[]).map(a=>[a.id,a]));

  // 处理标签
  const tagIds=[...new Set((tagRels.data||[]).map(r=>r.tag_id))];
  let tagMap=new Map<string,any[]>();
  if(tagIds.length>0){
    const {data:tags}=await supabase.from("community_tags").select("id,name,slug,color").in("id",tagIds);
    const tagById=new Map((tags||[]).map(t=>[t.id,t]));
    (tagRels.data||[]).forEach(r=>{if(tagById.has(r.tag_id)){if(!tagMap.has(r.post_id))tagMap.set(r.post_id,[]);tagMap.get(r.post_id)!.push(tagById.get(r.tag_id)!);}});
  }

  const result=posts.map(p=>({...p,author:authorMap.get(p.author_id)||null,tags:tagMap.get(p.id)||[],like_count:likeCounts.get(p.id)||0,comment_count:commentCounts.get(p.id)||0}));
  return {posts:result as CommunityPost[],total:count||0};
});

export const getPost = _cached(async function getPost(postId:string){
  const supabase=await createClient();
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
  supabase.from("community_posts").update({view_count:(post.view_count||0)+1}).eq("id",postId).then(()=>{},()=>{});
  return {...post,author:authorRes.data||null,tags,like_count:likeRes.count||0,comment_count:commentRes.count||0} as CommunityPost;
});

export const getComments = _cached(async function getComments(postId:string){
  const supabase=await createClient();
  const {data:comments,error}=await supabase.from("community_comments").select("*").eq("post_id",postId).is("parent_id",null).order("created_at",{ascending:true});
  if(error||!comments||comments.length===0)return [];
  const authorIds=[...new Set(comments.map(c=>c.author_id))];
  const {data:authors}=await supabase.from("profiles").select("id,display_name,avatar_url").in("id",authorIds);
  const authorMap=new Map((authors||[]).map(a=>[a.id,a]));
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
});

export const getUserProfile = _cached(async function getUserProfile(userId:string){
  const supabase=await createClient();
  const {data:profile}=await supabase.from("profiles").select("*").eq("id",userId).single();
  if(!profile)return null;
  const [{count:followingCount},{count:followerCount},{data:posts}]=await Promise.all([
    supabase.from("user_follows").select("*",{count:"exact",head:true}).eq("follower_id",userId),
    supabase.from("user_follows").select("*",{count:"exact",head:true}).eq("following_id",userId),
    supabase.from("community_posts").select("id,title,created_at,view_count").eq("author_id",userId).order("created_at",{ascending:false}).limit(20),
  ]);
  return {...profile,following_count:followingCount||0,follower_count:followerCount||0,posts:posts||[]};
});

export const getNotifications = _cached(async function getNotifications(userId: string, page = 1) {
  const supabase = await createClient();
  const { data: notifs, count } = await supabase.from("notifications").select("*", { count: "estimated" }).eq("user_id", userId).order("created_at", { ascending: false }).range((page-1)*20, page*20-1);
  if (!notifs || notifs.length === 0) return { notifications: [], total: count || 0 };
  const actorIds = [...new Set(notifs.map((n: any) => n.actor_id).filter(Boolean))];
  const { data: actors } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", actorIds);
  const actorMap = new Map((actors || []).map((a: any) => [a.id, a]));
  const enriched = notifs.map((n: any) => ({ ...n, actor: actorMap.get(n.actor_id) || null }));
  return { notifications: enriched, total: count || 0 };
});
export const markNotificationsRead = _cached(async function markNotificationsRead(userId: string) {
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
});
export const getUserFavorites = _cached(async function getUserFavorites(userId:string){
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
});
export const getUserLikes = _cached(async function getUserLikes(userId:string){
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
});
export const getFeed = _cached(async function getFeed(userId:string,page=1){
  const supabase=await createClient();
  const {data:follows}=await supabase.from("user_follows").select("following_id").eq("follower_id",userId);
  if(!follows||follows.length===0)return {posts:[],total:0};
  const followingIds=follows.map(f=>f.following_id);
  const {data:posts,count}=await supabase.from("community_posts").select("*",{count:"estimated"}).in("author_id",followingIds).order("created_at",{ascending:false}).range((page-1)*12,page*12-1);
  if(!posts||posts.length===0)return {posts:[],total:0};

  const pIds=posts.map(p=>p.id);
  const aIds=[...new Set(posts.map(p=>p.author_id))];

  // 🚀 批量并行
  const [authorsRes,tagRels,likeCounts,commentCounts]=await Promise.all([
    supabase.from("profiles").select("id,display_name,avatar_url").in("id",aIds),
    supabase.from("community_post_tags").select("post_id,tag_id").in("post_id",pIds),
    batchCounts(supabase,"community_likes",pIds),
    batchCounts(supabase,"community_comments",pIds),
  ]);

  const aMap=new Map((authorsRes.data||[]).map(a=>[a.id,a]));

  // 标签
  const tIds=[...new Set((tagRels.data||[]).map(r=>r.tag_id))];
  let tMap=new Map<string,any[]>();
  if(tIds.length>0){
    const {data:tags}=await supabase.from("community_tags").select("*").in("id",tIds);
    const tb=new Map((tags||[]).map(t=>[t.id,t]));
    (tagRels.data||[]).forEach(r=>{if(tb.has(r.tag_id)){if(!tMap.has(r.post_id))tMap.set(r.post_id,[]);tMap.get(r.post_id)!.push(tb.get(r.tag_id)!);}});
  }

  const enriched=posts.map(p=>({...p,author:aMap.get(p.author_id)||null,like_count:likeCounts.get(p.id)||0,comment_count:commentCounts.get(p.id)||0,tags:tMap.get(p.id)||[]}));
  return {posts:enriched,total:count||0};
});
export const getFollowing = _cached(async function getFollowing(userId:string,page=1){
  const supabase=await createClient();
  const {data}=await supabase.from("user_follows").select("following_id,created_at").eq("follower_id",userId).order("created_at",{ascending:false}).range((page-1)*20,page*20-1);
  if(!data||data.length===0)return [];
  const ids=data.map(r=>r.following_id);
  const {data:profiles}=await supabase.from("profiles").select("id,display_name,avatar_url,bio").in("id",ids);
  const pMap=new Map((profiles||[]).map(p=>[p.id,p]));
  return data.map(r=>({...pMap.get(r.following_id)||{},followed_at:r.created_at}));
});
export const getFollowers = _cached(async function getFollowers(userId:string,page=1){
  const supabase=await createClient();
  const {data}=await supabase.from("user_follows").select("follower_id,created_at").eq("following_id",userId).order("created_at",{ascending:false}).range((page-1)*20,page*20-1);
  if(!data||data.length===0)return [];
  const ids=data.map(r=>r.follower_id);
  const {data:profiles}=await supabase.from("profiles").select("id,display_name,avatar_url,bio").in("id",ids);
  const pMap=new Map((profiles||[]).map(p=>[p.id,p]));
  return data.map(r=>({...pMap.get(r.follower_id)||{},followed_at:r.created_at}));
});
// 私信系统 v2
export const getOrCreateConversation = _cached(async function getOrCreateConversation(userId:string,otherId:string){
  const supabase=await createClient();
  const p1=userId<otherId?userId:otherId;
  const p2=userId<otherId?otherId:userId;

  // 尝试查找已有会话
  const {data:conv,error:lookupErr}=await supabase.from("conversations").select("*").eq("participant_1",p1).eq("participant_2",p2).maybeSingle();
  if(lookupErr){
    console.error("getOrCreateConversation lookup error:",lookupErr.code, lookupErr.message);
    // PGRST116 = no rows (not a real error), 42P01 = table doesn't exist
    if(lookupErr.code==="42P01")throw new Error("私信服务未初始化，请执行 messages-migration-safe.sql");
    // 其他错误可能是 RLS 或权限问题，尝试 fallback
  }
  if(conv)return conv;

  // 创建新会话
  const {data:created,error:createErr}=await supabase.from("conversations").insert({participant_1:p1,participant_2:p2}).select("*").single();
  if(createErr){
    // 23505 = 并发创建导致唯一约束冲突，重新查询
    if(createErr.code==="23505"){
      const {data:retry}=await supabase.from("conversations").select("*").eq("participant_1",p1).eq("participant_2",p2).maybeSingle();
      if(retry)return retry;
    }
    // 42501 = 权限不足 (RLS)
    if(createErr.code==="42501")throw new Error("私信权限不足，请检查 RLS 策略是否已执行");
    console.error("getOrCreateConversation create error:",createErr.code, createErr.message);
    throw new Error("创建会话失败: "+createErr.message);
  }
  return created;
});
export const getConversations = _cached(async function getConversations(userId:string){
  const supabase=await createClient();
  const filter=`participant_1.eq.${userId},participant_2.eq.${userId}`;
  const {data:convs}=await supabase.from("conversations").select("*").or(filter).order("updated_at",{ascending:false});
  if(!convs||convs.length===0)return [];
  const convIds=convs.map(c=>c.id);
  const otherIds=convs.map(c=>c.participant_1===userId?c.participant_2:c.participant_1);

  // 🚀 批量获取 profiles + 所有最后消息 + 所有未读计数（各 1 次查询）
  const [profilesRes,allMsgs,allUnread]=await Promise.all([
    supabase.from("profiles").select("id,display_name,avatar_url").in("id",otherIds),
    // 获取每个会话的最后一条消息：一次性查出所有会话的所有消息（限制每个会话 1 条比较复杂，先批量查最近消息）
    supabase.from("messages").select("conversation_id,content,created_at,sender_id").in("conversation_id",convIds).order("created_at",{ascending:false}).limit(convIds.length * 3),
    supabase.from("messages").select("conversation_id").in("conversation_id",convIds).neq("sender_id",userId).eq("is_read",false),
  ]);

  const pMap=new Map((profilesRes.data||[]).map(p=>[p.id,p]));

  // 构建 per-conversation 最后消息 map（取每个 conv 的最新一条）
  const lastMsgMap=new Map<string,{content:string;created_at:string}>();
  (allMsgs.data||[]).forEach((m:any)=>{
    if(!lastMsgMap.has(m.conversation_id)){
      lastMsgMap.set(m.conversation_id,{content:m.content,created_at:m.created_at});
    }
  });

  // 构建未读计数 map
  const unreadMap=new Map<string,number>();
  (allUnread.data||[]).forEach((m:any)=>{
    unreadMap.set(m.conversation_id,(unreadMap.get(m.conversation_id)||0)+1);
  });

  return convs.map(c=>{
    const oid=c.participant_1===userId?c.participant_2:c.participant_1;
    const last=lastMsgMap.get(c.id);
    return {
      conversationId:c.id,
      userId:oid,
      profile:pMap.get(oid)||null,
      lastMsg:last?.content||"",
      lastTime:last?.created_at||c.created_at,
      unread:unreadMap.get(c.id)||0,
    };
  });
});
export const getMessages = _cached(async function getMessages(conversationId:string,page=1){
  const supabase=await createClient();
  const {data}=await supabase.from("messages").select("*").eq("conversation_id",conversationId).order("created_at",{ascending:true}).range((page-1)*50,page*50-1);
  return data||[];
});
export async function sendMessage(conversationId:string,senderId:string,content:string){
  const supabase=await createClient();
  const {data,error}=await supabase.from("messages").insert({conversation_id:conversationId,sender_id:senderId,content}).select("*").single();
  if(error){console.error("sendMessage error:",error);return null}
  return data;
}
export const getUnreadMessageCount = _cached(async function getUnreadMessageCount(userId:string){
  const supabase=await createClient();
  // 先获取用户参与的所有会话
  const {data:convs}=await supabase.from("conversations").select("id").or(`participant_1.eq.${userId},participant_2.eq.${userId}`);
  if(!convs||convs.length===0)return 0;
  const convIds=convs.map(c=>c.id);
  const {count}=await supabase.from("messages").select("*",{count:"exact",head:true}).in("conversation_id",convIds).neq("sender_id",userId).eq("is_read",false);
  return count||0;
});
