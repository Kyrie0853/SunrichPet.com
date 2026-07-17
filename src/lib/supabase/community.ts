// ============================================================
// 社区功能已移除（给我爬 v3 精简版）。
// 以下为向后兼容的占位导出，避免其他模块导入报错。
// ============================================================

// Stub exports - 社区功能已下线
export async function getHotPosts() { return { posts: [], total: 0 }; }
export async function getPosts() { return { posts: [], total: 0 }; }
export async function getPost() { return null; }
export async function getComments() { return []; }
export async function getUserProfile(userId: string) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return profile || null;
}
export async function getNotifications() { return { notifications: [], total: 0 }; }
export async function markNotificationsRead() {}
export async function getUserFavorites() { return []; }
export async function getUserLikes() { return []; }
export async function getFeed() { return { posts: [], total: 0 }; }
export async function getFollowing() { return []; }
export async function getFollowers() { return []; }
export async function getOrCreateConversation() { throw new Error("私信功能已下线"); }
export async function getConversations() { return []; }
export async function getMessages() { return []; }
export async function sendMessage() { return null; }
export async function getUnreadMessageCount() { return 0; }

export type CommunityPost = any;
export type SortOption = string;
export const SORT_OPTIONS: Record<string, string> = {};
