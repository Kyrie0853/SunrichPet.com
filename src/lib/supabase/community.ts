import { createClient } from '@/lib/supabase/server';
import type { CommunityPost, CommunityCategory, SortOption } from '@/lib/supabase/community-types';

export type { CommunityPost, CommunityCategory, SortOption };
export { CATEGORY_LABELS, SORT_OPTIONS } from '@/lib/supabase/community-types';

export async function getPosts(options: {
  category?: CommunityCategory;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}) {
  const { category, sort = "latest", page = 1, pageSize = 12 } = options;
  const supabase = await createClient();

  const selectQuery = [
    "*",
    "author:profiles!community_posts_author_id_fkey(id, display_name, avatar_url)",
    "tags:community_post_tags(tag:community_tags(id, name, slug, color))"
  ].join(", ");

  let query = supabase.from("community_posts").select(selectQuery);

  if (category) query = query.eq("category", category);

  switch (sort) {
    case "latest":
      query = query.order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
      break;
    case "hot":
      query = query.order("is_pinned", { ascending: false }).order("view_count", { ascending: false });
      break;
    case "trending": {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", sevenDaysAgo).order("view_count", { ascending: false });
      break;
    }
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error } = await query;
  if (error) { console.error(error); return { posts: [], total: 0 }; }

  const postsWithCounts = await Promise.all(
    (data || []).map(async (post: any) => {
      const results = await Promise.all([
        supabase.from("community_likes").select("*", { count: "exact", head: true }).eq("post_id", post.id),
        supabase.from("community_comments").select("*", { count: "exact", head: true }).eq("post_id", post.id),
      ]);
      return {
        ...post,
        like_count: (results[0] as any).count || 0,
        comment_count: (results[1] as any).count || 0,
        tags: (post.tags || []).map((t: any) => t.tag).filter(Boolean),
      };
    })
  );
  return { posts: postsWithCounts as CommunityPost[], total: data?.length || 0 };
}

export async function getPost(postId: string) {
  const supabase = await createClient();
  supabase.from("community_posts").select("view_count").eq("id", postId).single().then(({ data: row }) => {
    if (row) supabase.from("community_posts").update({ view_count: (row.view_count||0)+1 }).eq("id", postId).then(()=>{},()=>{});
  }, ()=>{});
  const sq = ["*","author:profiles!community_posts_author_id_fkey(id,display_name,avatar_url)","tags:community_post_tags(tag:community_tags(id,name,slug,color))"].join(",");
  const { data, error } = await supabase.from("community_posts").select(sq).eq("id",postId).single();
  if (error||!data) return null;
  const d = data as any;
  const [lk,cm] = await Promise.all([
    supabase.from("community_likes").select("*",{count:"exact",head:true}).eq("post_id",d.id),
    supabase.from("community_comments").select("*",{count:"exact",head:true}).eq("post_id",d.id),
  ]);
  return {...d,like_count:(lk as any).count||0,comment_count:(cm as any).count||0,tags:(d.tags||[]).map((t: any) => t.tag).filter(Boolean)} as CommunityPost;
}

export async function getComments(postId: string) {
  const supabase = await createClient();
  const sq = ["*","author:profiles!community_comments_author_id_fkey(id,display_name,avatar_url)"].join(",");
  const { data, error } = await supabase.from("community_comments").select(sq).eq("post_id",postId).is("parent_id",null).order("created_at",{ascending:true});
  if (error||!data) return [];
  const withReplies = await Promise.all(data.map(async(c: any)=>{
    const {data:replies} = await supabase.from("community_comments").select(sq).eq("parent_id",c.id).order("created_at",{ascending:true});
    return {...c,replies:replies||[]};
  }));
  return withReplies;
}
// 获取用户主页资料
export async function getUserProfile(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (!profile) return null;
  const [{ count: followingCount }, { count: followerCount }, { data: posts }] = await Promise.all([
    supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
    supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("community_posts").select("id,title,created_at,view_count").eq("author_id", userId).order("created_at", { ascending: false }).limit(20),
  ]);
  return { ...profile, following_count: followingCount||0, follower_count: followerCount||0, posts: posts||[] } as any;
}
