export type CommunityPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  images: string[];
  is_pinned: boolean;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  author_id: string;
  author: { id: string; display_name: string | null; avatar_url: string | null };
  like_count: number;
  comment_count: number;
  tags: { id: string; name: string; slug: string; color: string; parent_id?: string }[];
};

export type CommunityTag = {
  id: string;
  name: string;
  slug: string;
  color: string;
  parent_id?: string|null;
};

// 帖子分类标签（已扁平化，移除"爬宠""水族"大类）
export const PARENT_TABS = [
  { key: "" as const, label: "全部" },
  { key: "featured" as const, label: "精华", color: "#d97706" },
];

export type SortOption = "latest" | "hot" | "trending";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "latest", label: "最新" },
  { value: "hot", label: "热门" },
  { value: "trending", label: "趋势" },
];