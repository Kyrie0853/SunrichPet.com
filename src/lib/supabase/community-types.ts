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
  tags: { id: string; name: string; slug: string; color: string }[];
};

export type CommunityCategory =
  | "general" | "reptile" | "fish" | "bird" | "small-pet"
  | "qa" | "marketplace-discuss" | "showcase" | "guide";

export const CATEGORY_LABELS: Record<CommunityCategory, string> = {
  general: "综合讨论", reptile: "爬宠世界", fish: "水族天地",
  bird: "鸟类乐园", "small-pet": "小宠之家", qa: "问答求助",
  "marketplace-discuss": "交易交流", showcase: "晒宠展示", guide: "饲养教程",
};

export type SortOption = "latest" | "hot" | "trending";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "latest", label: "最新" },
  { value: "hot", label: "热门" },
  { value: "trending", label: "趋势" },
];