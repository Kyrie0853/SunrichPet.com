export type CommunityPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  images: string[];
  is_pinned: boolean;
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

// 父分类（论坛首页顶部 Tab）
export const PARENT_TABS = [
  { key: "" as const, label: "全部" },
  { key: "reptile" as const, label: "爬宠", color: "#059669" },
  { key: "aquarium" as const, label: "水族", color: "#0284c7" },
];

export type SortOption = "latest" | "hot" | "trending";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "latest", label: "最新" },
  { value: "hot", label: "热门" },
  { value: "trending", label: "趋势" },
];