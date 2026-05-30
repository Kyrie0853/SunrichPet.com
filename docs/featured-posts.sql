-- 精华帖字段
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS community_posts_featured_idx ON public.community_posts(is_featured) WHERE is_featured = true;
